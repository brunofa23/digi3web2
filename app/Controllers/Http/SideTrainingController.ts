import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import Typebook from 'App/Models/Typebook'
import IndeximageSideLabel from 'App/Models/IndeximageSideLabel'
import IndeximageOcrCheck from 'App/Models/IndeximageOcrCheck'
import { sendDownloadFileBuffer } from 'App/Services/googleDrive/googledrive'
import { loadBookSideVisualModel, extractBookSideVisualFeatures, predictBookSideVisual } from 'App/Services/ocr/bookSideVisualModel'
import crypto from 'crypto'
import { verifyPermission } from 'App/Services/util'
import BadRequestException from 'App/Exceptions/BadRequestException'

export default class SideTrainingController {
  private requestedStage(ctx: HttpContextContract) {
    const stage = String(ctx.request.input('stage') || 'development')
    if (!['development', 'validation'].includes(stage)) throw new BadRequestException('Etapa de revisão inválida', 422)
    return stage
  }

  private requestedBook(ctx: HttpContextContract) {
    const value = ctx.request.input('book')
    if (value === undefined || value === null || value === '') return null
    const book = Number(value)
    if (!Number.isInteger(book) || book <= 0) throw new BadRequestException('Número do livro inválido', 422)
    return book
  }

  private async access(ctx: HttpContextContract) {
    const user = await ctx.auth.use('api').authenticate()
    const permissions = ctx.auth.use('api').token?.meta.payload.permissions || []

    if (!verifyPermission(Boolean(user.superuser), permissions, 44)) {
      throw new BadRequestException('Acesso a conferência OCR não permitido', 403, 'ocr_conference_permission_required')
    }

    const typebooksId = Number(ctx.params.typebooks_id)
    if (!Number.isInteger(typebooksId) || typebooksId <= 0) {
      throw new BadRequestException('typebooks_id inválido', 400)
    }

    const typebook = await Typebook.query()
      .where('id', typebooksId)
      .andWhere('companies_id', user.companies_id)
      .first()

    if (!typebook) throw new BadRequestException('Livro não encontrado', 404)

    return { user, typebooksId, typebook }
  }

  public async index(ctx: HttpContextContract) {
    const { user, typebooksId } = await this.access(ctx)
    const book = this.requestedBook(ctx)
    const stage = this.requestedStage(ctx)
    const model = book ? await loadBookSideVisualModel(user.companies_id, typebooksId, book) : null
    if (stage === 'validation' && !model) throw new BadRequestException('Este livro ainda não tem modelo visual para validar', 422)
    const trainingIds = new Set(model?.training_samples.map((sample) => sample.bookrecords_id) || [])
    const rows = await IndeximageSideLabel.query()
      .where('companies_id', user.companies_id)
      .andWhere('typebooks_id', typebooksId)
      .orderBy('position', 'asc')

    const records = await Database.from('bookrecords')
      .where('companies_id', user.companies_id)
      .andWhere('typebooks_id', typebooksId)
      .whereIn('id', rows.map((row) => row.bookrecords_id))
      .select('id', 'cod', 'book', 'sheet', 'side')
    const recordById = new Map(records.map((record) => [Number(record.id), record]))
    const visibleRows = rows.filter((row) => {
      if (book !== null && Number(recordById.get(row.bookrecords_id)?.book) !== book) return false
      return !model || (stage === 'validation' ? !trainingIds.has(row.bookrecords_id) : trainingIds.has(row.bookrecords_id))
    })
    const completed = visibleRows.length > 0 && visibleRows.every((row) => row.label !== null)
    const audit = completed ? { matches: 0, divergent: 0, missing: 0, inconclusive: 0, cases: [] as any[] } : null
    const evaluation = book !== null && visibleRows.length
      ? { method: stage === 'validation' ? `Modelo visual ${model!.version}` : 'Regra atual de bordas', correct: 0, wrong: 0, not_found: 0, not_processed: 0, pending: 0, excluded: 0 }
      : null
    const checkByImage = new Map<string, any>()

    if (evaluation) {
      const checkQuery = Database.from('indeximage_ocr_checks')
        .where('companies_id', user.companies_id)
        .andWhere('typebooks_id', typebooksId)
        .whereIn('bookrecords_id', visibleRows.map((row) => row.bookrecords_id))
        .whereNotNull('side_processed_at')
        .orderBy('side_processed_at', 'desc')
        .orderBy('id', 'desc')
        .select('bookrecords_id', 'seq', 'detected_side', 'side_evidence', 'side_processed_at')
      if (stage === 'validation') checkQuery.andWhere('layout_profile', model!.version)
      else checkQuery.whereIn('layout_profile', ['header_keyword', 'top_isolated_number'])
      const checks = await checkQuery

      for (const check of checks) {
        const key = `${check.bookrecords_id}:${check.seq}`
        if (!checkByImage.has(key)) checkByImage.set(key, check)
      }
    }

    const evaluatedItems = visibleRows.map((row) => {
      const check = checkByImage.get(`${row.bookrecords_id}:${row.seq}`)
      const detectedSide = ['F', 'V'].includes(check?.detected_side) ? check.detected_side : null
      let detectionStatus: 'pending' | 'excluded' | 'not_processed' | 'not_found' | 'correct' | 'wrong' | null = null

      if (evaluation) {
        if (row.label === null) detectionStatus = 'pending'
        else if (row.label === 'U') detectionStatus = 'excluded'
        else if (!check) detectionStatus = 'not_processed'
        else if (!detectedSide) detectionStatus = 'not_found'
        else detectionStatus = detectedSide === row.label ? 'correct' : 'wrong'
        evaluation[detectionStatus]++
      }

      return {
        id: row.id,
        position: row.position,
        bookrecords_id: row.bookrecords_id,
        seq: row.seq,
        file_name: row.file_name,
        label: row.label,
        cod: recordById.get(row.bookrecords_id)?.cod ?? null,
        book: recordById.get(row.bookrecords_id)?.book ?? null,
        sheet: recordById.get(row.bookrecords_id)?.sheet ?? null,
        detected_side: detectedSide,
        side_evidence: check?.side_evidence ?? null,
        side_processed_at: check?.side_processed_at ?? null,
        detection_status: detectionStatus,
      }
    })

    if (audit) {
      for (const row of visibleRows) {
        if (row.label === 'U') {
          audit.inconclusive++
          continue
        }
        const record = recordById.get(row.bookrecords_id)
        const savedSide = String(record?.side || '').trim().toUpperCase()
        if (savedSide === row.label) {
          audit.matches++
          continue
        }
        const status = ['F', 'V'].includes(savedSide) ? 'divergent' : 'missing'
        if (status === 'divergent') audit.divergent++
        else audit.missing++
        audit.cases.push({
          label_id: row.id,
          bookrecords_id: row.bookrecords_id,
          cod: record?.cod ?? null,
          book: record?.book ?? null,
          sheet: record?.sheet ?? null,
          saved_side: savedSide || null,
          reviewed_side: row.label,
          status,
        })
      }
    }

    return ctx.response.ok({
      total: visibleRows.length,
      reviewed: visibleRows.filter((row) => row.label !== null).length,
      audit,
      evaluation,
      stage,
      visual_model: model ? {
        version: model.version,
        training_count: model.training_samples.length,
        development: model.development,
        training_unchanged: model.training_samples.every((sample) => rows.some((row) => row.bookrecords_id === sample.bookrecords_id && row.seq === sample.seq && row.label === sample.label)),
      } : null,
      items: evaluatedItems,
    })
  }

  public async createSample(ctx: HttpContextContract) {
    const { user, typebooksId } = await this.access(ctx)
    const book = this.requestedBook(ctx)
    const stage = this.requestedStage(ctx)
    const model = book ? await loadBookSideVisualModel(user.companies_id, typebooksId, book) : null
    if (stage === 'validation' && !model) throw new BadRequestException('Este livro ainda não tem modelo visual para validar', 422)
    const trainingIds = new Set(model?.training_samples.map((sample) => sample.bookrecords_id) || [])

    await Database.transaction(async (trx) => {
      await Typebook.query({ client: trx })
        .where('id', typebooksId)
        .andWhere('companies_id', user.companies_id)
        .forUpdate()
        .firstOrFail()

      const existingRows = await IndeximageSideLabel.query({ client: trx })
        .where('companies_id', user.companies_id)
        .andWhere('typebooks_id', typebooksId)

      if (book === null && existingRows.length) return

      const selected: any[] = []
      let existingForBook: number[] = []
      let excludedRecords: number[] = []
      if (book !== null) {
        const records = await Database.from('bookrecords')
          .useTransaction(trx)
          .where('companies_id', user.companies_id)
          .andWhere('typebooks_id', typebooksId)
          .whereIn('id', existingRows.map((row) => row.bookrecords_id))
          .andWhere('book', book)
          .select('id')
        excludedRecords = records.map((row) => Number(row.id))
        existingForBook = excludedRecords.filter((id) => !model || (stage === 'validation' ? !trainingIds.has(id) : trainingIds.has(id)))
        if (existingForBook.length >= 40) return
      }

      // A sequência inicial varia entre acervos. Selecionar uma imagem válida por registro.
      const sampleQuery = () =>
        Database.from('bookrecords as bookrecords')
          .useTransaction(trx)
          .join('indeximages as indeximages', (join) => {
            join.on('indeximages.bookrecords_id', 'bookrecords.id')
              .andOn('indeximages.typebooks_id', 'bookrecords.typebooks_id')
              .andOn('indeximages.companies_id', 'bookrecords.companies_id')
          })
          .where('bookrecords.companies_id', user.companies_id)
          .andWhere('bookrecords.typebooks_id', typebooksId)
          .whereNotNull('indeximages.drive_file_id')
          .whereNot('indeximages.drive_file_id', '')
          .whereIn('indeximages.ext', ['.jpg', '.jpeg', '.png', '.webp'])
          .whereNotExists((earlier) => {
            earlier.from('indeximages as earlier')
              .whereColumn('earlier.bookrecords_id', 'indeximages.bookrecords_id')
              .whereColumn('earlier.typebooks_id', 'indeximages.typebooks_id')
              .whereColumn('earlier.companies_id', 'indeximages.companies_id')
              .whereColumn('earlier.seq', '<', 'indeximages.seq')
              .whereNotNull('earlier.drive_file_id')
              .whereNot('earlier.drive_file_id', '')
              .whereIn('earlier.ext', ['.jpg', '.jpeg', '.png', '.webp'])
          })

      if (book !== null) {
        const query = sampleQuery()
          .andWhere('bookrecords.book', book)
          .orderByRaw("CRC32(CONCAT(bookrecords.id, ':side-training-book-v1'))")
          .limit(40 - existingForBook.length)
          .select('bookrecords.id as bookrecords_id', 'indeximages.seq', 'indeximages.drive_file_id', 'indeximages.file_name')
        if (excludedRecords.length) query.whereNotIn('bookrecords.id', excludedRecords)
        if (stage === 'validation') query.whereNotIn('bookrecords.sheet', model!.training_samples.map((sample) => sample.sheet))
        const rows = await query
        selected.push(...rows)
      } else {
        for (const side of ['F', 'V']) {
          const rows = await sampleQuery()
            .andWhere('bookrecords.side', side)
            .orderByRaw("CRC32(CONCAT(bookrecords.id, ':side-training-v1'))")
            .limit(20)
            .select('bookrecords.id as bookrecords_id', 'indeximages.seq', 'indeximages.drive_file_id', 'indeximages.file_name')
          selected.push(...rows)
        }
      }

      if (!selected.length && !existingForBook.length) throw new BadRequestException('Nenhuma imagem disponível para revisão', 422)
      if (!selected.length) return

      const nextPosition = existingRows.reduce((max, row) => Math.max(max, row.position), 0) + 1
      await IndeximageSideLabel.createMany(selected.map((row, index) => ({
        companies_id: user.companies_id,
        typebooks_id: typebooksId,
        bookrecords_id: row.bookrecords_id,
        seq: row.seq,
        position: nextPosition + index,
        drive_file_id: row.drive_file_id,
        file_name: row.file_name,
      })), { client: trx })
    })

    return this.index(ctx)
  }

  public async evaluateVisual(ctx: HttpContextContract) {
    const { user, typebooksId, typebook } = await this.access(ctx)
    const row = await IndeximageSideLabel.query()
      .where('id', Number(ctx.params.id))
      .andWhere('companies_id', user.companies_id)
      .andWhere('typebooks_id', typebooksId)
      .firstOrFail()
    if (!['F', 'V'].includes(row.label || '')) throw new BadRequestException('Revise a imagem antes de avaliar o modelo', 422)
    const record = await Database.from('bookrecords')
      .where('id', row.bookrecords_id).andWhere('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).first()
    if (!record) throw new BadRequestException('Registro não encontrado', 404)
    const model = await loadBookSideVisualModel(user.companies_id, typebooksId, Number(record.book))
    if (!model) throw new BadRequestException('Modelo visual não disponível para este livro', 422)
    if (model.training_samples.some((sample) => sample.bookrecords_id === row.bookrecords_id)) {
      throw new BadRequestException('Esta imagem foi usada no desenvolvimento e não pode ser usada na validação independente', 422)
    }
    if (model.training_samples.some((sample) => Number(sample.sheet) === Number(record.sheet))) {
      throw new BadRequestException('Esta folha já participou do desenvolvimento. Use uma folha diferente para validação independente', 422)
    }
    const trainingRows = await IndeximageSideLabel.query()
      .where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId)
      .whereIn('bookrecords_id', model.training_samples.map((sample) => sample.bookrecords_id))
    if (!model.training_samples.every((sample) => trainingRows.some((label) => label.bookrecords_id === sample.bookrecords_id && label.seq === sample.seq && label.label === sample.label))) {
      throw new BadRequestException('As revisões usadas no treinamento mudaram. O modelo precisa ser revisto', 409)
    }
    const image = await Database.from('indeximages')
      .where('bookrecords_id', row.bookrecords_id).andWhere('companies_id', user.companies_id)
      .andWhere('typebooks_id', typebooksId).andWhere('seq', row.seq)
      .andWhere('drive_file_id', row.drive_file_id).andWhere('file_name', row.file_name).first()
    if (!image) throw new BadRequestException('A imagem original da revisão foi alterada', 409)
    await typebook.load('company')
    if (!typebook.company?.cloud) throw new BadRequestException('Empresa sem configuração de cloud', 422)
    const buffer = await sendDownloadFileBuffer(row.drive_file_id, typebook.company.cloud)
    const hash = crypto.createHash('sha256').update(buffer).digest('hex')
    if (model.training_samples.some((sample) => sample.sha256 === hash)) throw new BadRequestException('Imagem duplicada do treinamento; não serve para validação independente', 422)
    const extracted = await extractBookSideVisualFeatures(buffer, model.extractor_sha256)
    const prediction = predictBookSideVisual(model, extracted.features)
    await IndeximageOcrCheck.updateOrCreate({
      companies_id: user.companies_id, typebooks_id: typebooksId,
      bookrecords_id: row.bookrecords_id, seq: row.seq, layout_profile: model.version,
    }, {
      detected_side: prediction.side, side_confidence: null,
      side_evidence: model.version,
      side_processed_at: DateTime.local(), expected_sheet: record.sheet ?? null,
      sheet_status: 'not_found', term_status: 'not_found', review_status: 'pending', auto_applied: false,
    })
    return ctx.response.ok({ id: row.id, detected_side: prediction.side, model_version: model.version })
  }

  public async updateLabel(ctx: HttpContextContract) {
    const { user, typebooksId } = await this.access(ctx)
    const id = Number(ctx.params.id)
    const label = String(ctx.request.input('label') || '').trim().toUpperCase()

    if (!Number.isInteger(id) || id <= 0 || !['F', 'V', 'U'].includes(label)) {
      throw new BadRequestException('Classificação inválida', 422)
    }

    const row = await IndeximageSideLabel.query()
      .where('id', id)
      .andWhere('companies_id', user.companies_id)
      .andWhere('typebooks_id', typebooksId)
      .first()

    if (!row) throw new BadRequestException('Imagem da amostra não encontrada', 404)

    const image = await Database.from('indeximages')
      .where('companies_id', user.companies_id)
      .andWhere('typebooks_id', typebooksId)
      .andWhere('bookrecords_id', row.bookrecords_id)
      .andWhere('seq', row.seq)
      .andWhere('drive_file_id', row.drive_file_id)
      .andWhere('file_name', row.file_name)
      .first()

    if (!image) throw new BadRequestException('A imagem original da amostra foi alterada', 409)

    row.label = label
    row.reviewed_by = user.id
    row.reviewed_at = DateTime.local()
    await row.save()

    return ctx.response.ok({ id: row.id, label: row.label, reviewed_at: row.reviewed_at })
  }
}
