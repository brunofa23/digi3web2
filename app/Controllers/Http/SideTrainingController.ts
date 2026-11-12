import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import Typebook from 'App/Models/Typebook'
import IndeximageSideLabel from 'App/Models/IndeximageSideLabel'
import IndeximageOcrCheck from 'App/Models/IndeximageOcrCheck'
import IndeximageSideModel from 'App/Models/IndeximageSideModel'
import { sendDownloadFileBuffer } from 'App/Services/googleDrive/googledrive'
import { loadBookSideVisualModel, extractBookSideVisualFeatures, predictBookSideVisual, bookSideModelRegistry, bookSideVisualReadiness, sideModelSummary, BookSideVisualModel } from 'App/Services/ocr/bookSideVisualModel'
import { wakeBookSideTrainingWorker } from 'App/Services/ocr/bookSideModelTraining'
import crypto from 'crypto'
import fs from 'fs/promises'
import Application from '@ioc:Adonis/Core/Application'
import { verifyPermission } from 'App/Services/util'
import BadRequestException from 'App/Exceptions/BadRequestException'

export default class SideTrainingController {
  private requestedModelId(ctx: HttpContextContract) {
    const value = ctx.request.input('modelId')
    if (value === undefined || value === null || value === '') return null
    const id = Number(value)
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestException('Versão do modelo inválida', 422)
    return id
  }

  private async modelContext(ctx: HttpContextContract, companyId: number, typebookId: number, book: number | null) {
    const registry = book ? await bookSideModelRegistry(companyId, typebookId, book) : { available: true, records: [] as IndeximageSideModel[] }
    const modelId = this.requestedModelId(ctx)
    if (modelId && !registry.records.some((record) => record.id === modelId)) throw new BadRequestException('Modelo não encontrado neste livro', 404)
    const model = book ? await loadBookSideVisualModel(companyId, typebookId, book, { candidate: true, modelId }) : null
    return { registry, model }
  }

  private async storeLegacyModel(model: BookSideVisualModel, userId: number, trx: any) {
    if (model.model_id) {
      const stored = await IndeximageSideModel.query({ client: trx }).where('id', model.model_id)
        .andWhere('companies_id', model.company_id).andWhere('typebooks_id', model.typebook_id).whereNull('archived_at').first()
      if (!stored) throw new BadRequestException('Esta base foi arquivada ou excluída. Atualize a lista de bases', 409)
      return model
    }
    const existing = await IndeximageSideModel.query({ client: trx }).where('version', model.version).andWhere('companies_id', model.company_id).andWhere('typebooks_id', model.typebook_id).andWhere('book', model.book).first()
    if (existing?.archived_at) throw new BadRequestException('Restaure esta base antes de utilizá-la novamente', 409)
    if (existing) return { ...model, model_id: existing.id, active: existing.active_slot === 1, validation_label_ids: existing.validation_label_ids }
    const labels = await Database.from('indeximage_side_labels as labels').useTransaction(trx)
      .join('bookrecords as records', (join) => join.on('records.id', 'labels.bookrecords_id').andOn('records.companies_id', 'labels.companies_id').andOn('records.typebooks_id', 'labels.typebooks_id'))
      .where('labels.companies_id', model.company_id).andWhere('labels.typebooks_id', model.typebook_id).andWhere('records.book', model.book)
      .select('labels.*', 'records.sheet')
    const trainingIds = new Set(model.training_samples.map((sample) => sample.bookrecords_id))
    const validationIds = labels.filter((label) => !trainingIds.has(Number(label.bookrecords_id))).map((label) => Number(label.id))
    const ready = await bookSideVisualReadiness({ ...model, validation_label_ids: validationIds })
    const stored = await IndeximageSideModel.create({ companies_id: model.company_id, typebooks_id: model.typebook_id, book: model.book,
      version: model.version, status: 'ready', phase: 'ready', total: model.training_samples.length, processed: model.training_samples.length,
      training_samples: labels.filter((label) => trainingIds.has(Number(label.bookrecords_id))).map((label) => ({ label_id: Number(label.id), bookrecords_id: Number(label.bookrecords_id), seq: Number(label.seq), sheet: Number(label.sheet), book: Number(label.book), label: label.label, drive_file_id: label.drive_file_id, file_name: label.file_name })),
      validation_label_ids: validationIds, model_data: model, requested_by: userId, active_slot: ready.ready ? 1 : null, finished_at: DateTime.utc(),
    }, { client: trx })
    return { ...model, model_id: stored.id, active: stored.active_slot === 1, validation_label_ids: validationIds }
  }
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

  private requestedSourceBooks(ctx: HttpContextContract, fallback: number | null) {
    const input = ctx.request.input('sourceBooks') ?? ctx.request.qs().sourceBooks
    const values = Array.isArray(input) ? input : typeof input === 'string' ? input.split(',').filter(Boolean) : []
    const books = [...new Set(values.map(Number))]
    if (books.some((value) => !Number.isInteger(value) || value <= 0) || books.length > 100) {
      throw new BadRequestException('Selecione até 100 números de livro válidos para compor a base', 422)
    }
    if (fallback && !books.includes(fallback)) books.unshift(fallback)
    if (books.length > 100) throw new BadRequestException('Selecione até 100 números de livro válidos para compor a base', 422)
    return books.length ? books : fallback ? [fallback] : []
  }

  private requestedSampleSize(ctx: HttpContextContract) {
    const value = ctx.request.input('sampleSize') ?? ctx.request.qs().sampleSize
    if (value === undefined || value === null || value === '') return 40
    const size = Number(value)
    if (![20, 25, 30, 35, 40].includes(size)) throw new BadRequestException('Escolha uma amostra de 20, 25, 30, 35 ou 40 imagens', 422)
    return size
  }

  private async access(ctx: HttpContextContract, permissionIds: number[] = [53]) {
    const user = await ctx.auth.use('api').authenticate()
    const permissions = ctx.auth.use('api').token?.meta.payload.permissions || []

    if (!permissionIds.some((permissionId) => verifyPermission(Boolean(user.superuser), permissions, permissionId))) {
      throw new BadRequestException('Acesso ao treinamento de IA não permitido', 403, 'side_training_permission_required')
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

  public async bookAvailability(ctx: HttpContextContract) {
    const { user, typebooksId } = await this.access(ctx)
    const sourceBooks = this.requestedSourceBooks(ctx, null)
    if (!sourceBooks.length) throw new BadRequestException('Informe os livros que formarão a base', 422)
    const sampleSize = this.requestedSampleSize(ctx)
    const records = await Database.from('bookrecords')
      .where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId)
      .whereIn('book', sourceBooks).select('book').count('* as total').groupBy('book')
    const images = await Database.from('bookrecords as records')
      .where('records.companies_id', user.companies_id).andWhere('records.typebooks_id', typebooksId)
      .whereIn('records.book', sourceBooks)
      .whereExists((query) => {
        query.from('indeximages as images')
          .whereColumn('images.bookrecords_id', 'records.id')
          .whereColumn('images.companies_id', 'records.companies_id')
          .whereColumn('images.typebooks_id', 'records.typebooks_id')
          .whereNotNull('images.drive_file_id').whereNot('images.drive_file_id', '')
          .whereIn('images.ext', ['.jpg', '.jpeg', '.png', '.webp'])
          .select('images.bookrecords_id')
      })
      .select('records.book').count('* as total').groupBy('records.book')
    const availableBooks = sourceBooks.filter((book) => Number(images.find((row) => Number(row.book) === book)?.total || 0) > 0)
    const tooManyBooks = availableBooks.length > sampleSize
    const books = sourceBooks.map((book) => {
      const totalRecords = Number(records.find((row) => Number(row.book) === book)?.total || 0)
      const imageRecords = Number(images.find((row) => Number(row.book) === book)?.total || 0)
      const index = availableBooks.indexOf(book)
      const required = index < 0 ? 0 : tooManyBooks ? 1 : Math.floor(sampleSize / availableBooks.length) + (index < sampleSize % availableBooks.length ? 1 : 0)
      return { book, records: totalRecords, image_records: imageRecords, required, ignored: index < 0, enough: index < 0 || imageRecords >= required }
    })
    return ctx.response.ok({ sample_size: sampleSize, valid: availableBooks.length > 0 && !tooManyBooks && books.every((item) => item.enough), too_many_books: tooManyBooks, available_books: availableBooks, ignored_books: sourceBooks.filter((book) => !availableBooks.includes(book)), books })
  }

  public async index(ctx: HttpContextContract) {
    const { user, typebooksId } = await this.access(ctx, [53, 54])
    const book = this.requestedBook(ctx)
    const stage = this.requestedStage(ctx)
    const permissions = ctx.auth.use('api').token?.meta.payload.permissions || []
    const canTrain = verifyPermission(Boolean(user.superuser), permissions, 53)
    if (!canTrain && (book === null || stage !== 'development')) {
      throw new BadRequestException('A verificação de divergências exige um livro específico', 403, 'side_divergences_permission_scope')
    }
    const { registry } = await this.modelContext(ctx, user.companies_id, typebooksId, book)
    let model = book !== null ? await loadBookSideVisualModel(user.companies_id, typebooksId, book, { candidate: true, modelId: this.requestedModelId(ctx) }) : null
    const sourceBooks = stage === 'development' ? this.requestedSourceBooks(ctx, book) : []
    if (stage === 'development' && !this.requestedModelId(ctx) && ((ctx.request.input('createBase') ?? ctx.request.qs().createBase) === true || (ctx.request.input('createBase') ?? ctx.request.qs().createBase) === '1' || (ctx.request.input('sourceBooks') ?? ctx.request.qs().sourceBooks)) && model && sourceBooks.length > 1) {
      const currentBooks = model.source_books || [model.source_book || model.book]
      if (currentBooks.length !== sourceBooks.length || currentBooks.some((sourceBook) => !sourceBooks.includes(Number(sourceBook)))) model = null
    }
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
    const validationIds = new Set(registry.records.flatMap((record) => record.validation_label_ids || []))
    if (model && !model.model_id) rows.filter((row) => Number(recordById.get(row.bookrecords_id)?.book) === book && !trainingIds.has(row.bookrecords_id)).forEach((row) => validationIds.add(row.id))
    const selectedJob = registry.records.find((record) => record.id === this.requestedModelId(ctx))
    const queuedTrainingIds = new Set(selectedJob?.training_samples.map((sample) => sample.label_id) || [])
    const allVisibleRows = rows.filter((row) => {
      if (book !== null && Number(recordById.get(row.bookrecords_id)?.book) !== book && !(stage === 'development' && (trainingIds.has(row.bookrecords_id) || sourceBooks.includes(Number(recordById.get(row.bookrecords_id)?.book)))) && !(stage === 'validation' && (!model?.source_model_id || model.training_updated) && model?.source_books?.includes(Number(recordById.get(row.bookrecords_id)?.book)))) return false
      if (stage === 'validation') return model?.validation_label_ids ? model.validation_label_ids.includes(row.id) : !trainingIds.has(row.bookrecords_id)
      return trainingIds.has(row.bookrecords_id) || queuedTrainingIds.has(row.id) || !validationIds.has(row.id)
    })
    let visibleRows = allVisibleRows
    if (stage === 'validation' && (!model?.source_model_id || model.training_updated) && (model?.source_books?.length || 0) > 1 && allVisibleRows.length > 40 && allVisibleRows.filter((row) => ['F', 'V'].includes(row.label || '')).length < 40) {
      visibleRows = allVisibleRows.filter((row) => row.label !== null)
    }
    if (stage === 'validation' && model?.source_model_id && !model.training_updated) {
      let visibleCount = Math.min(10, allVisibleRows.length)
      while (visibleCount < allVisibleRows.length) {
        const reviewedBatch = allVisibleRows.slice(0, visibleCount)
        if (reviewedBatch.some((row) => row.label === null)) break
        const fronts = reviewedBatch.filter((row) => row.label === 'F').length
        const backs = reviewedBatch.filter((row) => row.label === 'V').length
        if (fronts >= 5 && backs >= 5) break
        visibleCount = Math.min(allVisibleRows.length, visibleCount + 10)
      }
      visibleRows = allVisibleRows.slice(0, visibleCount)
    }
    const completed = visibleRows.length > 0 && visibleRows.every((row) => row.label !== null)
    const modelReadiness = model ? await bookSideVisualReadiness(model) : null
    const sharedValidation = Boolean(model && (!model.source_model_id || model.training_updated) && (model.source_books?.length || 0) > 1)
    const validationAccuracyThreshold = model?.validation_accuracy_threshold ?? (sharedValidation ? 80 : 100)
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
      model_registry_available: registry.available,
      models: registry.records.map(sideModelSummary),
      training_job: registry.records[0] ? sideModelSummary(registry.records[0]) : null,
      visual_model: model ? {
        model_id: model.model_id || null,
        source_model_id: model.source_model_id || null,
        source_book: model.source_book || null,
        active: Boolean(model.active),
        version: model.version,
        training_count: model.training_samples.length,
        development: model.development,
        training_unchanged: modelReadiness!.trainingUnchanged,
        validation_ready: modelReadiness!.ready,
        validation_total: modelReadiness!.total,
        validation_required: modelReadiness!.required,
        validation_accuracy_threshold: validationAccuracyThreshold,
        validation_required_accuracy: Math.ceil(modelReadiness!.required * validationAccuracyThreshold / 100),
        source_books: model.source_books || [model.source_book || model.book],
        training_updated: Boolean(model.training_updated),
        validation_correct: modelReadiness!.correct,
      } : null,
      items: evaluatedItems,
    })
  }

  public async modelStatus(ctx: HttpContextContract) {
    const { user, typebooksId } = await this.access(ctx)
    const book = this.requestedBook(ctx)
    if (!book) throw new BadRequestException('Selecione um livro', 422)
    const registry = await bookSideModelRegistry(user.companies_id, typebooksId, book)
    return ctx.response.ok({ available: registry.available, models: registry.records.map(sideModelSummary), training_job: registry.records[0] ? sideModelSummary(registry.records[0]) : null })
  }

  public async updateValidationAccuracyThreshold(ctx: HttpContextContract) {
    const { user, typebooksId } = await this.access(ctx)
    const modelId = Number(ctx.params.model_id)
    const book = this.requestedBook(ctx)
    const threshold = Number(ctx.request.input('threshold'))
    if (!Number.isInteger(modelId) || modelId <= 0 || !book) throw new BadRequestException('Modelo ou livro inválido', 422)
    if (![80, 85, 90, 95, 100].includes(threshold)) throw new BadRequestException('Escolha um mínimo de acertos entre 80% e 100%', 422)

    const stored = await IndeximageSideModel.query().where('id', modelId)
      .andWhere('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId)
      .andWhere('book', book).andWhere('status', 'ready').whereNull('archived_at').first()
    if (!stored?.model_data) throw new BadRequestException('Modelo não encontrado ou ainda não treinado', 404)
    if (stored.active_slot === 1) throw new BadRequestException('O critério de aprovação não pode ser alterado após ativar a base', 409)
    const sourceBooks = stored.source_books || stored.model_data.source_books || [stored.book]
    const sharedValidation = sourceBooks.length > 1 && (!stored.source_model_id || stored.model_data.training_updated)
    if (!sharedValidation) throw new BadRequestException('O percentual configurável está disponível somente para bases compartilhadas', 422)

    stored.validation_accuracy_threshold = threshold
    await stored.save()
    const model = await loadBookSideVisualModel(user.companies_id, typebooksId, book, { candidate: true, modelId })
    const readiness = model ? await bookSideVisualReadiness(model) : null
    return ctx.response.ok({ threshold, ready: Boolean(readiness?.ready), correct: readiness?.correct || 0, total: readiness?.total || 0, required: readiness?.required || 40 })
  }

  public async bookDivergences(ctx: HttpContextContract) {
    const { user, typebooksId } = await this.access(ctx, [53, 54])
    const book = this.requestedBook(ctx)
    if (!book) throw new BadRequestException('Selecione um livro para conferir os lados', 422)
    const sheetStartInput = ctx.request.input('sheetStart')
    const sheetEndInput = ctx.request.input('sheetEnd')
    const sheetStart = sheetStartInput === undefined || sheetStartInput === null || sheetStartInput === '' ? null : Number(sheetStartInput)
    const sheetEnd = sheetEndInput === undefined || sheetEndInput === null || sheetEndInput === '' ? null : Number(sheetEndInput)
    if ((sheetStart !== null && (!Number.isInteger(sheetStart) || sheetStart < 0))
      || (sheetEnd !== null && (!Number.isInteger(sheetEnd) || sheetEnd < 0))
      || (sheetStart !== null && sheetEnd !== null && sheetEnd < sheetStart)) {
      throw new BadRequestException('Intervalo de folhas inválido', 422)
    }

    const model = await loadBookSideVisualModel(user.companies_id, typebooksId, book)
    if (!model || model.active !== true) throw new BadRequestException(`O livro ${book} ainda não tem um modelo visual ativo`, 422)
    const readiness = await bookSideVisualReadiness(model)
    if (!readiness.ready) throw new BadRequestException(`O modelo visual do livro ${book} precisa estar aprovado e ativo para a conferência`, 422)

    const buildQuery = () => {
      const query = Database.from('indeximage_ocr_checks as checks')
        .join('bookrecords as records', (join) => join
        .on('records.id', 'checks.bookrecords_id')
        .andOn('records.companies_id', 'checks.companies_id')
        .andOn('records.typebooks_id', 'checks.typebooks_id'))
        .where('checks.companies_id', user.companies_id)
        .andWhere('checks.typebooks_id', typebooksId)
        .andWhere('checks.layout_profile', model.version)
        .andWhere('records.book', book)
        .whereNotNull('checks.side_processed_at')
      if (sheetStart !== null) query.andWhere('records.sheet', '>=', sheetStart)
      if (sheetEnd !== null) query.andWhere('records.sheet', '<=', sheetEnd)
      return query
    }

    const checkedResult = await buildQuery().count('* as total').first()
    const divergences = await buildQuery()
      .whereIn('checks.detected_side', ['F', 'V'])
      .whereNotNull('records.side')
      .whereRaw('records.side <> checks.detected_side')
      .select('records.id as bookrecords_id', 'records.cod', 'records.book', 'records.sheet', 'records.side as saved_side', 'checks.detected_side', 'checks.side_evidence')
      .orderBy('records.sheet', 'asc').orderBy('records.cod', 'asc')

    return ctx.response.ok({ checked: Number(checkedResult?.total || 0), divergences })
  }

  private baseGroupKey(model: IndeximageSideModel) {
    if (model.model_data?.source_book || (model.source_model_id && model.model_data && !model.model_data.training_updated)) return null
    return [...(model.source_books || model.model_data?.source_books || [model.book])].sort((a, b) => a - b).join(',')
  }

  public async adminBaseModels(ctx: HttpContextContract) {
    const user = await ctx.auth.use('api').authenticate()
    if (!user.superuser || Number(user.companies_id) !== 1) throw new BadRequestException('Acesso restrito à administração da empresa 1', 403)
    const companyId = Number(ctx.request.qs().companyId)
    if (!Number.isInteger(companyId) || companyId <= 0) throw new BadRequestException('Selecione uma empresa', 422)
    const models = await IndeximageSideModel.query().where('companies_id', companyId).orderBy('id', 'desc')
    const typebookIds = [...new Set(models.map((model) => model.typebooks_id))]
    const typebooks = typebookIds.length ? await Typebook.query().where('companies_id', companyId).whereIn('id', typebookIds) : []
    const names = new Map(typebooks.map((typebook) => [typebook.id, typebook.name]))
    const groups = new Map<string, IndeximageSideModel[]>()
    for (const model of models) {
      const books = this.baseGroupKey(model)
      const key = books ? `${model.typebooks_id}:${books}:${Boolean(model.archived_at)}` : `${model.typebooks_id}:herdado:${model.id}`
      groups.set(key, [...(groups.get(key) || []), model])
    }
    return ctx.response.ok({ models: [...groups.values()].map((group) => {
      const model = group.find((row) => row.active_slot === 1) || group.find((row) => row.status === 'ready') || group[0]
      const ids = new Set(group.map((row) => row.id))
      return { id: model.id, typebooks_id: model.typebooks_id, typebook_name: names.get(model.typebooks_id) || `Tipo ${model.typebooks_id}`,
        source_books: model.source_books || model.model_data?.source_books || [model.book], book: model.book,
        inherited: !this.baseGroupKey(model), version_count: group.length,
        active: group.some((row) => row.active_slot === 1), archived: Boolean(model.archived_at),
        busy: group.some((row) => ['queued', 'training'].includes(row.status)),
        has_dependents: models.some((row) => !ids.has(row.id) && ids.has(row.source_model_id || row.model_data?.source_model_id || 0)) }
    }) })
  }

  public async adminDeleteBase(ctx: HttpContextContract) {
    const user = await ctx.auth.use('api').authenticate()
    if (!user.superuser || Number(user.companies_id) !== 1) throw new BadRequestException('Acesso restrito à administração da empresa 1', 403)
    const companyId = Number(ctx.request.input('companyId'))
    const modelId = Number(ctx.params.model_id)
    if (!Number.isInteger(companyId) || companyId <= 0 || !Number.isInteger(modelId) || modelId <= 0 || ctx.request.input('confirm') !== true) throw new BadRequestException('Empresa, modelo ou confirmação inválidos', 422)
    const deleted = await Database.transaction(async (trx) => {
      const models = await IndeximageSideModel.query({ client: trx }).where('companies_id', companyId).forUpdate()
      const selected = models.find((row) => row.id === modelId)
      if (!selected) throw new BadRequestException('Base não encontrada nesta empresa', 404)
      const selectedKey = this.baseGroupKey(selected)
      const group = selectedKey ? models.filter((row) => row.typebooks_id === selected.typebooks_id && this.baseGroupKey(row) === selectedKey && Boolean(row.archived_at) === Boolean(selected.archived_at)) : [selected]
      const ids = group.map((row) => row.id)
      if (group.some((row) => ['queued', 'training'].includes(row.status))) throw new BadRequestException('Aguarde o treinamento terminar', 409)
      if (models.some((row) => !ids.includes(row.id) && ids.includes(row.source_model_id || row.model_data?.source_model_id || 0))) throw new BadRequestException('Exclua primeiro as bases que usam esta base como referência', 409)
      for (const book of new Set(group.map((row) => row.book))) {
        const file = Application.resourcesPath(`side-models/${companyId}-${selected.typebooks_id}-${book}.json`)
        try {
          const legacy = JSON.parse(await fs.readFile(file, 'utf8'))
          if (legacy.company_id === companyId && legacy.typebook_id === selected.typebooks_id && legacy.book === book && group.some((row) => row.version === legacy.version)) await fs.unlink(file)
        } catch (error) { if (error.code !== 'ENOENT') throw error }
      }
      await IndeximageSideModel.query({ client: trx }).where('companies_id', companyId).andWhere('typebooks_id', selected.typebooks_id).whereIn('id', ids).delete()
      return ids.length
    })
    return ctx.response.ok({ message: `${deleted} versão(ões) excluída(s).` })
  }

  public async baseModels(ctx: HttpContextContract) {
    const { user, typebooksId } = await this.access(ctx)
    try {
      const models = await IndeximageSideModel.query()
        .where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId)
        .orderBy('id', 'desc')
      const groups = new Map<string, IndeximageSideModel[]>()
      for (const model of models) {
        const booksKey = this.baseGroupKey(model)
        if (!booksKey) continue
        const key = `${booksKey}:${Boolean(model.archived_at)}`
        groups.set(key, [...(groups.get(key) || []), model])
      }
      const trainedBases = [...groups.values()].filter((group) => group.some((model) => model.status === 'ready' && model.model_data))
      return ctx.response.ok({ available: true, trained_bases: trainedBases.map((group) => {
        const model = group.find((row) => row.active_slot === 1) || group.find((row) => row.status === 'ready' && row.model_data)!
        const ids = new Set(group.map((row) => row.id))
        const dependents = models.filter((row) => !ids.has(row.id) && ids.has(row.source_model_id || row.model_data?.source_model_id || 0)).length
        const busy = group.some((row) => ['queued', 'training'].includes(row.status))
        const active = group.some((row) => row.active_slot === 1)
        const replacement = models.find((row) => row.book === model.book && row.active_slot === 1 && !row.archived_at && row.id > model.id)
        return { id: model.id, book: model.book, source_books: model.source_books || model.model_data?.source_books || [model.book],
          training_count: model.training_samples.length, active, archived: Boolean(model.archived_at), version_count: group.length,
          can_archive: !active && !busy, can_delete: Boolean(model.archived_at) && !active && !busy && !dependents,
          management_block_reason: active ? 'Substitua a base ativa antes de arquivar.' : busy ? 'Aguarde o treinamento deste grupo terminar.' : null,
          delete_block_reason: dependents ? 'Esta base é referência de outros modelos e não pode ser excluída.' : null,
          superseded_by: replacement ? replacement.source_books || replacement.model_data?.source_books || [replacement.book] : null }
      }), models: models.filter((model) => model.status === 'ready' && model.active_slot === 1 && !model.archived_at && model.model_data).map((model) => ({
        id: model.id, book: model.book, source_books: model.source_books || model.model_data?.source_books || [model.book], version: model.version, training_count: model.training_samples.length,
      })) })
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE' || error.errno === 1146) return ctx.response.ok({ available: false, models: [], trained_bases: [] })
      throw error
    }
  }

  public async archiveBase(ctx: HttpContextContract) {
    const archived = ctx.request.input('archived')
    if (typeof archived !== 'boolean') throw new BadRequestException('Informe se deseja arquivar ou restaurar a base', 422)
    return this.changeBase(ctx, archived ? 'archive' : 'restore')
  }

  public async deleteBase(ctx: HttpContextContract) {
    return this.changeBase(ctx, 'delete')
  }

  public async resetBases(ctx: HttpContextContract) {
    const { user, typebooksId } = await this.access(ctx)
    if (!user.superuser || Number(user.companies_id) !== 1) throw new BadRequestException('Somente superusuários da empresa 1 podem limpar as bases de treinamento', 403, 'side_training_reset_superuser_required')
    if (ctx.request.input('confirm') !== true) throw new BadRequestException('Confirme a exclusão das bases deste conjunto', 422)
    const deleted = await Database.transaction(async (trx) => {
      await Typebook.query({ client: trx }).where('id', typebooksId).andWhere('companies_id', user.companies_id).forUpdate().firstOrFail()
      const models = await IndeximageSideModel.query({ client: trx }).where('companies_id', user.companies_id)
        .andWhere('typebooks_id', typebooksId).forUpdate()
      if (models.some((row) => ['queued', 'training'].includes(row.status))) throw new BadRequestException('Aguarde os treinamentos em andamento antes de limpar as bases', 409)
      if (!models.length) return 0

      for (const book of new Set(models.map((row) => row.book))) {
        const file = Application.resourcesPath(`side-models/${user.companies_id}-${typebooksId}-${book}.json`)
        try {
          const legacy = JSON.parse(await fs.readFile(file, 'utf8'))
          if (legacy.company_id === user.companies_id && legacy.typebook_id === typebooksId && legacy.book === book) await fs.unlink(file)
        } catch (error) { if (error.code !== 'ENOENT') throw error }
      }

      await IndeximageSideModel.query({ client: trx }).where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).delete()
      return models.length
    })
    return ctx.response.ok({ deleted, message: `${deleted} versão(ões) de base removida(s). Registros, imagens e marcações foram preservados.` })
  }

  private async changeBase(ctx: HttpContextContract, action: 'archive' | 'restore' | 'delete') {
    const { user, typebooksId } = await this.access(ctx)
    if (action === 'delete' && (!user.superuser || Number(user.companies_id) !== 1)) throw new BadRequestException('Somente superusuários da empresa 1 podem excluir bases de treinamento', 403, 'side_training_delete_superuser_required')
    const modelId = Number(ctx.params.model_id)
    if (!Number.isInteger(modelId) || modelId <= 0) throw new BadRequestException('Base inválida', 422)
    await Database.transaction(async (trx) => {
      await Typebook.query({ client: trx }).where('id', typebooksId).andWhere('companies_id', user.companies_id).forUpdate().firstOrFail()
      const models = await IndeximageSideModel.query({ client: trx }).where('companies_id', user.companies_id)
        .andWhere('typebooks_id', typebooksId).forUpdate()
      const model = models.find((row) => row.id === modelId)
      if (!model || !this.baseGroupKey(model)) throw new BadRequestException('Base não encontrada', 404)
      const group = models.filter((row) => this.baseGroupKey(row) === this.baseGroupKey(model) && Boolean(row.archived_at) === Boolean(model.archived_at))
      if (group.some((row) => row.active_slot === 1)) throw new BadRequestException('Substitua a base ativa antes de arquivar ou excluir', 409)
      if (group.some((row) => ['queued', 'training'].includes(row.status))) throw new BadRequestException('Aguarde o treinamento deste grupo terminar', 409)
      const ids = group.map((row) => row.id)
      const query = IndeximageSideModel.query({ client: trx }).where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).whereIn('id', ids)
      if (action !== 'delete') {
        await query.update({ archived_at: action === 'archive' ? DateTime.utc().toSQL({ includeOffset: false }) : null })
        return
      }
      if (!model.archived_at) throw new BadRequestException('Arquive a base antes de excluí-la definitivamente', 409)
      const dependent = await IndeximageSideModel.query({ client: trx }).whereIn('source_model_id', ids).whereNotIn('id', ids).first()
      if (dependent || models.some((row) => !ids.includes(row.id) && ids.includes(row.model_data?.source_model_id || 0))) {
        throw new BadRequestException('Esta base é referência de outros modelos e não pode ser excluída. Mantenha-a arquivada', 409)
      }
      // Remove apenas o modelo legado correspondente, evitando que ele reapareça pelo fallback.
      for (const book of new Set(group.map((row) => row.book))) {
        const file = Application.resourcesPath(`side-models/${user.companies_id}-${typebooksId}-${book}.json`)
        try {
          const legacy = JSON.parse(await fs.readFile(file, 'utf8'))
          if (legacy.company_id === user.companies_id && legacy.typebook_id === typebooksId && legacy.book === book && group.some((row) => row.version === legacy.version)) await fs.unlink(file)
        } catch (error) { if (error.code !== 'ENOENT') throw error }
      }
      await query.delete()
    })
    return ctx.response.ok({ message: action === 'archive' ? 'Base arquivada' : action === 'restore' ? 'Base restaurada. A ativação continua sendo feita separadamente' : 'Base excluída definitivamente' })
  }

  public async inheritModel(ctx: HttpContextContract) {
    const { user, typebooksId } = await this.access(ctx)
    const book = this.requestedBook(ctx)
    const sourceModelId = this.requestedModelId(ctx)
    if (!book || !sourceModelId) throw new BadRequestException('Selecione o livro de destino e o modelo-base', 422)

    const model = await Database.transaction(async (trx) => {
      await Typebook.query({ client: trx }).where('id', typebooksId).andWhere('companies_id', user.companies_id).forUpdate().firstOrFail()
      const source = await IndeximageSideModel.query({ client: trx })
        .where('id', sourceModelId).andWhere('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId)
        .andWhere('status', 'ready').andWhere('active_slot', 1).whereNull('archived_at').forUpdate().first()
      if (!source?.model_data) throw new BadRequestException('O modelo-base não está validado ou disponível', 404)
      if (Number(source.book) === book) throw new BadRequestException('Escolha um livro diferente do livro-base', 422)
      const readiness = await bookSideVisualReadiness({ ...source.model_data, model_id: source.id, validation_label_ids: source.validation_label_ids || [], validation_accuracy_threshold: source.validation_accuracy_threshold })
      if (!readiness.ready) throw new BadRequestException('O modelo-base precisa continuar validado antes de ser reutilizado', 409)

      const busy = await IndeximageSideModel.query({ client: trx }).where('companies_id', user.companies_id)
        .andWhere('typebooks_id', typebooksId).andWhere('book', book).whereIn('status', ['queued', 'training']).first()
      if (busy) throw new BadRequestException('Aguarde o treinamento deste livro terminar antes de reutilizar um modelo', 409)

      const version = `sv-${crypto.randomUUID()}`
      await IndeximageSideModel.query({ client: trx }).where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).andWhere('book', book).andWhere('active_slot', 1).update({ active_slot: null })
      const modelData: BookSideVisualModel = {
        ...source.model_data,
        typebook_id: typebooksId,
        book,
        version,
        source_model_id: source.id,
        source_book: source.book,
        source_books: source.source_books || source.model_data.source_books || [source.book],
        validation_hashes: {},
      }
      return IndeximageSideModel.create({
        companies_id: user.companies_id, typebooks_id: typebooksId, book, source_model_id: source.id,
        version, status: 'ready', phase: 'ready', total: source.total, processed: source.total,
        training_samples: source.training_samples, validation_label_ids: [], model_data: modelData, source_books: modelData.source_books,
        validation_accuracy_threshold: source.validation_accuracy_threshold,
        requested_by: user.id, active_slot: 1, finished_at: DateTime.utc(),
      }, { client: trx })
    })

    return ctx.response.created({ model_id: model.id, book, source_book: model.model_data?.source_book })
  }

  public async trainModel(ctx: HttpContextContract) {
    const { user, typebooksId } = await this.access(ctx)
    const book = this.requestedBook(ctx)
    if (!book) throw new BadRequestException('Selecione um livro para treinar', 422)
    const sampleSize = this.requestedSampleSize(ctx)
    const sourceBooks = this.requestedSourceBooks(ctx, book)
    const { registry, model } = await this.modelContext(ctx, user.companies_id, typebooksId, book)
    const existingBooks = model?.source_books || (model ? [model.book] : [])
    const reusingSameBase = Boolean(model?.model_id && existingBooks.length === sourceBooks.length
      && existingBooks.every((sourceBook) => sourceBooks.includes(sourceBook)))
    if (sourceBooks.length > sampleSize && !reusingSameBase) throw new BadRequestException('Há mais livros do que imagens na amostra. Aumente a amostra ou divida os livros em bases', 422)
    if (!registry.available) throw new BadRequestException('O treinamento ainda não foi habilitado neste servidor. Contate o administrador', 503)
    const job = await Database.transaction(async (trx) => {
      await Typebook.query({ client: trx }).where('id', typebooksId).andWhere('companies_id', user.companies_id).forUpdate().firstOrFail()
      const busy = await IndeximageSideModel.query({ client: trx }).where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).andWhere('book', book).whereIn('status', ['queued', 'training']).first()
      if (busy) return busy
      if (model) await this.storeLegacyModel(model, user.id, trx)
      const modelBooks = model?.source_books || (model ? [model.book] : [])
      const reuseValidation = Boolean(model?.model_id && model.validation_label_ids?.length && modelBooks.length === sourceBooks.length && modelBooks.every((sourceBook) => sourceBooks.includes(sourceBook)))
      const retainedValidation = reuseValidation ? await Database.from('indeximage_side_labels as labels').useTransaction(trx)
        .join('bookrecords as records', (join) => join.on('records.id', 'labels.bookrecords_id').andOn('records.companies_id', 'labels.companies_id').andOn('records.typebooks_id', 'labels.typebooks_id'))
        .join('indeximage_ocr_checks as checks', (join) => join.on('checks.bookrecords_id', 'labels.bookrecords_id').andOn('checks.companies_id', 'labels.companies_id').andOn('checks.typebooks_id', 'labels.typebooks_id').andOn('checks.seq', 'labels.seq').andOnVal('checks.layout_profile', model!.version))
        .where('labels.companies_id', user.companies_id).andWhere('labels.typebooks_id', typebooksId)
        .whereIn('labels.id', model!.validation_label_ids || []).whereIn('labels.label', ['F', 'V'])
        .whereColumn('checks.detected_side', 'labels.label').whereNotNull('checks.side_processed_at')
        .distinct('labels.id', 'labels.bookrecords_id', 'records.book', 'records.sheet') : []
      const heldoutRecords = new Set(retainedValidation.map((row) => Number(row.bookrecords_id)))
      const heldoutSheets = new Set(retainedValidation.map((row) => `${row.book}:${row.sheet}`))
      const labels = await Database.from('indeximage_side_labels as labels').useTransaction(trx)
        .join('bookrecords as records', (join) => join.on('records.id', 'labels.bookrecords_id').andOn('records.companies_id', 'labels.companies_id').andOn('records.typebooks_id', 'labels.typebooks_id'))
        .join('indeximages as images', (join) => join.on('images.bookrecords_id', 'labels.bookrecords_id').andOn('images.companies_id', 'labels.companies_id').andOn('images.typebooks_id', 'labels.typebooks_id').andOn('images.seq', 'labels.seq').andOn('images.drive_file_id', 'labels.drive_file_id'))
        .where('labels.companies_id', user.companies_id).andWhere('labels.typebooks_id', typebooksId).whereIn('records.book', sourceBooks).whereIn('labels.label', ['F', 'V'])
        .orderBy('records.sheet').orderBy('records.cod').select('labels.id', 'labels.bookrecords_id', 'labels.seq', 'labels.label', 'labels.drive_file_id', 'labels.file_name', 'records.sheet', 'records.book')
      const trainingLabels = labels.filter((label) => !heldoutRecords.has(Number(label.bookrecords_id)) && !heldoutSheets.has(`${label.book}:${label.sheet}`))
      const missingSourceBook = sourceBooks.find((sourceBook, index) => {
        const required = Math.floor(sampleSize / sourceBooks.length) + (index < sampleSize % sourceBooks.length ? 1 : 0)
        return trainingLabels.filter((label) => Number(label.book) === sourceBook).length < required
      })
      if (missingSourceBook) throw new BadRequestException(`Classifique as imagens necessárias do livro ${missingSourceBook} para representar todos os livros desta base`, 422)
      if (trainingLabels.length < sampleSize || !['F', 'V'].every((side) => trainingLabels.filter((label) => label.label === side).length >= 5)) {
        throw new BadRequestException(`Revise pelo menos ${sampleSize} imagens, incluindo cinco frentes e cinco versos. Use Adicionar imagens se necessário`, 422)
      }
      return IndeximageSideModel.create({ companies_id: user.companies_id, typebooks_id: typebooksId, book,
        version: `sv-${crypto.randomUUID()}`, status: 'queued', phase: 'queued', total: trainingLabels.length, processed: 0, source_books: sourceBooks, source_model_id: model?.model_id || null,
        training_samples: trainingLabels.map((label) => ({ label_id: Number(label.id), bookrecords_id: Number(label.bookrecords_id), seq: Number(label.seq), sheet: Number(label.sheet), book: Number(label.book), label: label.label, drive_file_id: label.drive_file_id, file_name: label.file_name })),
        validation_label_ids: retainedValidation.map((row) => Number(row.id)), validation_accuracy_threshold: model?.validation_accuracy_threshold ?? null, requested_by: user.id,
      }, { client: trx })
    })
    wakeBookSideTrainingWorker()
    return ctx.response.accepted({ training_job: sideModelSummary(job), model_id: job.id })
  }

  public async activateModel(ctx: HttpContextContract) {
    const { user, typebooksId } = await this.access(ctx)
    const book = this.requestedBook(ctx)
    if (!book) throw new BadRequestException('Selecione um livro', 422)
    const context = await this.modelContext(ctx, user.companies_id, typebooksId, book)
    if (!context.registry.available) throw new BadRequestException('O treinamento ainda não foi habilitado neste servidor. Contate o administrador', 503)
    if (!context.model) throw new BadRequestException('O modelo ainda não está pronto para validar', 422)
    const model = await Database.transaction(async (trx) => {
      await Typebook.query({ client: trx }).where('id', typebooksId).andWhere('companies_id', user.companies_id).forUpdate().firstOrFail()
      const candidate = await this.storeLegacyModel(context.model!, user.id, trx)
      const readiness = await bookSideVisualReadiness(candidate)
      if (!readiness.ready) {
        const sourceBooks = candidate.source_books || [candidate.book]
        const threshold = sourceBooks.length > 1 ? candidate.validation_accuracy_threshold ?? 80 : 100
        const requiredCorrect = Math.ceil(readiness.required * threshold / 100)
        throw new BadRequestException(`Para ativar, avalie ${readiness.required} imagens e alcance ${requiredCorrect} acertos (${threshold}%), com ao menos cinco frentes e cinco versos`, 422)
      }
      await IndeximageSideModel.query({ client: trx }).where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).andWhere('book', book).andWhere('active_slot', 1).update({ active_slot: null })
      await IndeximageSideModel.query({ client: trx }).where('id', candidate.model_id!).andWhere('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).andWhere('book', book).andWhere('status', 'ready').update({ active_slot: 1 })
      return candidate
    })
    return ctx.response.ok({ model_id: model.model_id, version: model.version, active: true })
  }

  public async createSample(ctx: HttpContextContract) {
    const { user, typebooksId } = await this.access(ctx)
    const book = this.requestedBook(ctx)
    const stage = this.requestedStage(ctx)
    const context = await this.modelContext(ctx, user.companies_id, typebooksId, book)
    if (book !== null && !context.registry.available) throw new BadRequestException('O treinamento ainda não foi habilitado neste servidor. Contate o administrador', 503)
    let model = context.model
    if (stage === 'validation' && !model) throw new BadRequestException('Este livro ainda não tem modelo visual para validar', 422)
    const sampleSize = stage === 'development' ? this.requestedSampleSize(ctx) : model?.source_model_id && !model.training_updated ? 10 : 40
    const sourceBooks = stage === 'development' ? this.requestedSourceBooks(ctx, book) : []
    if (stage === 'development' && sourceBooks.length > sampleSize) throw new BadRequestException('Há mais livros do que imagens na amostra. Aumente a amostra ou divida os livros em bases', 422)
    const sharedValidationBooks = stage === 'validation' && (!model?.source_model_id || model.training_updated) && (model?.source_books?.length || 0) > 1 ? model!.source_books! : []
    const additional = ctx.request.input('additional') === true
    const replaceLabelId = Number(ctx.request.input('replaceLabelId')) || null
    if (replaceLabelId && (stage !== 'validation' || !Number.isInteger(replaceLabelId) || replaceLabelId <= 0)) throw new BadRequestException('Referência de substituição inválida', 422)

    await Database.transaction(async (trx) => {
      await Typebook.query({ client: trx })
        .where('id', typebooksId)
        .andWhere('companies_id', user.companies_id)
        .forUpdate()
        .firstOrFail()

      if (book !== null) {
        const registry = await bookSideModelRegistry(user.companies_id, typebooksId, book)
        if (registry.available) {
          const busy = await IndeximageSideModel.query({ client: trx }).where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).andWhere('book', book).whereIn('status', ['queued', 'training']).first()
          if (busy) throw new BadRequestException('Aguarde o treinamento deste livro terminar antes de alterar a amostra', 409)
          if (model) model = await this.storeLegacyModel(model, user.id, trx)
        }
      }

      const existingRows = await IndeximageSideLabel.query({ client: trx })
        .where('companies_id', user.companies_id)
        .andWhere('typebooks_id', typebooksId)
      const validationShortfall = stage === 'validation' && additional && model
        ? Math.max(0, sampleSize - (await bookSideVisualReadiness(model)).total)
        : 0

      if (book === null && existingRows.length) return

      const selected: any[] = []
      let retainedValidationIds: number[] | null = null
      let existingForBook: number[] = []
      let excludedRecords: number[] = []
      let excludedSheets: number[] = []
      let target = sampleSize
      if (book !== null && !(stage === 'development' && sourceBooks.length > 1) && !sharedValidationBooks.length) {
        const records = await Database.from('bookrecords')
          .useTransaction(trx)
          .where('companies_id', user.companies_id)
          .andWhere('typebooks_id', typebooksId)
          .whereIn('id', existingRows.map((row) => row.bookrecords_id))
          .andWhere('book', book)
          .select('id', 'sheet')
        excludedRecords = records.map((row) => Number(row.id))
        excludedSheets = records.map((row) => Number(row.sheet))
        const currentBookRows = existingRows.filter((row) => excludedRecords.includes(row.bookrecords_id))
        const registered = await IndeximageSideModel.query({ client: trx }).where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).andWhere('book', book).select('validation_label_ids')
        const validationIds = new Set(registered.flatMap((row) => row.validation_label_ids || []))
        const trainingIds = new Set(model?.training_samples.map((sample) => sample.bookrecords_id) || [])
        let currentRows = stage === 'validation'
          ? currentBookRows.filter((row) => model?.validation_label_ids ? model.validation_label_ids.includes(row.id) : !trainingIds.has(row.bookrecords_id))
          : currentBookRows.filter((row) => trainingIds.has(row.bookrecords_id) || !validationIds.has(row.id))
        if (replaceLabelId) {
          const replacement = currentRows.find((row) => row.id === replaceLabelId)
          if (!replacement) throw new BadRequestException('Referência não encontrada nesta validação', 404)
          const processed = await IndeximageOcrCheck.query({ client: trx }).where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId)
            .andWhere('bookrecords_id', replacement.bookrecords_id).andWhere('seq', replacement.seq).andWhere('layout_profile', model!.version).whereNotNull('side_processed_at').first()
          if (processed) throw new BadRequestException('Uma referência já avaliada não pode ser substituída. Para melhorar o modelo, treine uma nova versão', 422)
          currentRows = currentRows.filter((row) => row.id !== replaceLabelId)
        }
        existingForBook = currentRows.map((row) => row.bookrecords_id)
        const pendingCount = currentRows.filter((row) => row.label === null).length
        if (additional) target = stage === 'validation'
          ? model?.source_model_id && !model.training_updated
            ? currentRows.length + 10
            : currentRows.length + Math.max(validationShortfall, 40 - currentRows.filter((row) => ['F', 'V'].includes(row.label || '')).length, 5 - currentRows.filter((row) => row.label === 'F').length, 5 - currentRows.filter((row) => row.label === 'V').length)
          : Math.max(sampleSize, currentRows.length + Math.max(0,
            sampleSize - currentRows.filter((row) => ['F', 'V'].includes(row.label || '')).length - pendingCount,
            5 - currentRows.filter((row) => row.label === 'F').length - pendingCount,
            5 - currentRows.filter((row) => row.label === 'V').length - pendingCount))
        if (replaceLabelId) target = currentRows.length + 1
        if (existingForBook.length >= target) return
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

      if (stage === 'development' && sourceBooks.length > 1) {
        const usedRecords = await Database.from('bookrecords').useTransaction(trx)
          .where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).whereIn('book', sourceBooks)
          .whereIn('id', existingRows.map((row) => row.bookrecords_id)).select('id', 'book')
        const selectedIds = usedRecords.map((row) => Number(row.id))
        const reviewedIds = new Set(existingRows.filter((row) => ['F', 'V'].includes(row.label || '')).map((row) => Number(row.bookrecords_id)))
        const missingCoverage = sourceBooks.some((sourceBook, index) =>
          usedRecords.filter((row) => Number(row.book) === sourceBook && reviewedIds.has(Number(row.id))).length
            < Math.floor(sampleSize / sourceBooks.length) + (index < sampleSize % sourceBooks.length ? 1 : 0))
        const totalTarget = sampleSize + (additional && !missingCoverage ? usedRecords.length : 0)
        const quota = Math.floor(totalTarget / sourceBooks.length)
        let added = 0
        for (let index = 0; index < sourceBooks.length; index++) {
          const target = quota + (index < totalTarget % sourceBooks.length ? 1 : 0)
          const currentCount = usedRecords.filter((row) => Number(row.book) === sourceBooks[index] && reviewedIds.has(Number(row.id))).length
          const needed = Math.max(0, target - currentCount)
          if (!needed) continue
          const query = sampleQuery().andWhere('bookrecords.book', sourceBooks[index])
          if (selectedIds.length) query.whereNotIn('bookrecords.id', selectedIds)
          const rows = await query.orderByRaw("CRC32(CONCAT(bookrecords.id, ':side-training-group-v1'))")
            .limit(needed)
            .select('bookrecords.id as bookrecords_id', 'indeximages.seq', 'indeximages.drive_file_id', 'indeximages.file_name')
          if (currentCount + rows.length < target) {
            const available = currentCount + rows.length
            throw new BadRequestException(available === 0
              ? `O livro ${sourceBooks[index]} não tem imagens disponíveis. Remova-o da lista de livros da base`
              : `O livro ${sourceBooks[index]} tem apenas ${available} de ${target} imagens necessárias. Altere a lista de livros ou reduza a amostra`, 422)
          }
          selected.push(...rows)
          selectedIds.push(...rows.map((row) => Number(row.bookrecords_id)))
          added += rows.length
        }
        const alreadyCovered = sourceBooks.every((sourceBook, index) => {
          const target = quota + (index < totalTarget % sourceBooks.length ? 1 : 0)
          return usedRecords.filter((row) => Number(row.book) === sourceBook && reviewedIds.has(Number(row.id))).length >= target
        })
        if (!added && alreadyCovered) return
      } else if (sharedValidationBooks.length) {
        const validationIds = new Set(model!.validation_label_ids || [])
        let currentRows = existingRows.filter((row) => validationIds.has(row.id))
        const currentEvidenceCount = currentRows.filter((row) => ['F', 'V'].includes(row.label || '')).length
        if (additional && currentEvidenceCount < 40 && currentRows.some((row) => row.label === 'U')) {
          // Imagens inconclusivas não contam para completar o teste. Ao pedir outras,
          // retire-as da amostra ativa para que as substitutas fiquem visíveis como pendentes.
          currentRows = currentRows.filter((row) => row.label !== 'U')
          retainedValidationIds = currentRows.map((row) => row.id)
        }
        if (currentRows.length > 40 && currentRows.filter((row) => ['F', 'V'].includes(row.label || '')).length < 40) {
          currentRows = currentRows.filter((row) => row.label !== null)
          retainedValidationIds = currentRows.map((row) => row.id)
        }
        const fronts = currentRows.filter((row) => row.label === 'F').length
        const backs = currentRows.filter((row) => row.label === 'V').length
        const target = additional ? currentRows.length + Math.max(validationShortfall, 40 - fronts - backs, 5 - fronts, 5 - backs) : 40
        const needed = target - currentRows.length
        if (needed <= 0) return
        const usedRecords = await Database.from('bookrecords').useTransaction(trx)
          .where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId)
          .whereIn('book', sharedValidationBooks).whereIn('id', existingRows.map((row) => row.bookrecords_id))
          .select('id', 'book', 'sheet')
        const usedIds = usedRecords.map((row) => Number(row.id))
        const countsByBook = new Map(sharedValidationBooks.map((sourceBook) => [sourceBook, 0]))
        for (const row of currentRows) {
          const record = usedRecords.find((entry) => Number(entry.id) === row.bookrecords_id)
          if (record) countsByBook.set(Number(record.book), (countsByBook.get(Number(record.book)) || 0) + 1)
        }
        const queues: { book: number; count: number; rows: any[] }[] = []
        for (const sourceBook of sharedValidationBooks) {
          const query = sampleQuery().andWhere('bookrecords.book', sourceBook)
          if (usedIds.length) query.whereNotIn('bookrecords.id', usedIds)
          const usedSheets = usedRecords.filter((row) => Number(row.book) === sourceBook).map((row) => Number(row.sheet))
          if (usedSheets.length) query.whereNotIn('bookrecords.sheet', usedSheets)
          const rows = await query.orderByRaw("CRC32(CONCAT(bookrecords.id, ':side-training-book-v1'))")
            .limit(needed).select('bookrecords.id as bookrecords_id', 'indeximages.seq', 'indeximages.drive_file_id', 'indeximages.file_name')
          queues.push({ book: sourceBook, count: countsByBook.get(sourceBook) || 0, rows })
        }
        while (selected.length < needed) {
          const available = queues.filter((queue) => queue.rows.length).sort((a, b) => a.count - b.count || a.book - b.book)
          if (!available.length) break
          const queue = available[0]
          selected.push(queue.rows.shift()!)
          queue.count++
        }
      } else if (book !== null) {
        const buildBookSampleQuery = () => {
          const query = sampleQuery().andWhere('bookrecords.book', book)
          if (excludedRecords.length) query.whereNotIn('bookrecords.id', excludedRecords)
          if (stage === 'validation') query.whereNotIn('bookrecords.sheet', [...excludedSheets, ...(model!.source_model_id ? [] : model!.training_samples.map((sample) => sample.sheet))])
          return query
        }
        const needed = target - existingForBook.length
        if (stage === 'validation' && model?.source_model_id && !replaceLabelId) {
          const perSide = Math.ceil(needed / 2)
          for (const side of ['F', 'V']) {
            const rows = await buildBookSampleQuery()
              .andWhere('bookrecords.side', side)
              .orderByRaw("CRC32(CONCAT(bookrecords.id, ':side-training-book-v1'))")
              .limit(perSide)
              .select('bookrecords.id as bookrecords_id', 'indeximages.seq', 'indeximages.drive_file_id', 'indeximages.file_name')
            selected.push(...rows)
          }
          if (selected.length < needed) {
            const selectedIds = selected.map((row) => Number(row.bookrecords_id))
            const fallback = buildBookSampleQuery()
              .orderByRaw("CRC32(CONCAT(bookrecords.id, ':side-training-book-v1'))")
              .limit(needed - selected.length)
            if (selectedIds.length) fallback.whereNotIn('bookrecords.id', selectedIds)
            selected.push(...await fallback.select('bookrecords.id as bookrecords_id', 'indeximages.seq', 'indeximages.drive_file_id', 'indeximages.file_name'))
          }
        } else {
          const rows = await buildBookSampleQuery()
            .orderByRaw("CRC32(CONCAT(bookrecords.id, ':side-training-book-v1'))")
            .limit(needed)
            .select('bookrecords.id as bookrecords_id', 'indeximages.seq', 'indeximages.drive_file_id', 'indeximages.file_name')
          selected.push(...rows)
        }
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

      if (!selected.length) throw new BadRequestException('Não há novas imagens disponíveis para completar esta amostra neste livro', 422)

      const nextPosition = existingRows.reduce((max, row) => Math.max(max, row.position), 0) + 1
      const created = await IndeximageSideLabel.createMany(selected.map((row, index) => ({
        companies_id: user.companies_id,
        typebooks_id: typebooksId,
        bookrecords_id: row.bookrecords_id,
        seq: row.seq,
        position: nextPosition + index,
        drive_file_id: row.drive_file_id,
        file_name: row.file_name,
      })), { client: trx })
      if (stage === 'validation' && model?.model_id) {
        const stored = await IndeximageSideModel.query({ client: trx }).where('id', model.model_id).andWhere('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).andWhere('book', model.book).forUpdate().firstOrFail()
        stored.validation_label_ids = [...(retainedValidationIds || stored.validation_label_ids).filter((id) => id !== replaceLabelId), ...created.map((row) => row.id)]
        await stored.save()
      }
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
    const model = (await this.modelContext(ctx, user.companies_id, typebooksId, Number(record.book))).model
    if (!model) throw new BadRequestException('Modelo visual não disponível para este livro', 422)
    if (model.validation_label_ids && !model.validation_label_ids.includes(row.id)) throw new BadRequestException('Esta imagem não pertence à validação desta versão do modelo', 422)
    if (model.training_samples.some((sample) => sample.bookrecords_id === row.bookrecords_id)) {
      throw new BadRequestException('Esta imagem foi usada no desenvolvimento e não pode ser usada na validação independente', 422)
    }
    const localTrainingSamples = model.source_model_id && !model.training_updated ? [] : model.training_samples.filter((sample) => Number(sample.book || model.book) === Number(record.book))
    const trainingRecords = await Database.from('bookrecords')
      .where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).andWhere('book', Number(record.book))
      .whereIn('id', localTrainingSamples.map((sample) => sample.bookrecords_id)).select('sheet')
    if ([...trainingRecords, ...localTrainingSamples].some((sample) => Number(sample.sheet) === Number(record.sheet))) {
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
      .andWhere('drive_file_id', row.drive_file_id).first()
    if (!image) throw new BadRequestException('A imagem original da revisão foi alterada', 409)
    await typebook.load('company')
    if (!typebook.company?.cloud) throw new BadRequestException('Empresa sem configuração de cloud', 422)
    const buffer = await sendDownloadFileBuffer(row.drive_file_id, typebook.company.cloud)
    const hash = crypto.createHash('sha256').update(buffer).digest('hex')
    if (model.training_samples.some((sample) => sample.sha256 === hash)) throw new BadRequestException('Imagem duplicada do treinamento; não serve para validação independente', 422)
    const extracted = await extractBookSideVisualFeatures(buffer, model.extractor_sha256)
    const prediction = predictBookSideVisual(model, extracted.features)
    await Database.transaction(async (trx) => {
      if (model.model_id) {
        const stored = await IndeximageSideModel.query({ client: trx }).where('id', model.model_id).andWhere('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).andWhere('book', model.book).forUpdate().firstOrFail()
        const data = stored.model_data!
        if (data.validation_hashes) {
          const duplicates = Object.entries(data.validation_hashes).filter(([labelId, value]) => Number(labelId) !== row.id && value === hash && stored.validation_label_ids.includes(Number(labelId))).map(([labelId]) => Number(labelId))
          if (duplicates.length && await IndeximageSideLabel.query({ client: trx }).where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).whereIn('id', duplicates).whereIn('label', ['F', 'V']).first()) {
            throw new BadRequestException('Esta imagem repete outra referência da validação. Substitua esta referência por outra imagem', 422)
          }
          stored.model_data = { ...data, validation_hashes: { ...data.validation_hashes, [String(row.id)]: hash } }
          await stored.save()
        }
      }
      await IndeximageOcrCheck.updateOrCreate({
        companies_id: user.companies_id, typebooks_id: typebooksId,
        bookrecords_id: row.bookrecords_id, seq: row.seq, layout_profile: model.version,
      }, {
        detected_side: prediction.side, side_confidence: null,
        side_evidence: model.model_id ? `Livro ${model.book} · versão ${model.model_id}` : model.version,
        side_processed_at: DateTime.local(), expected_sheet: record.sheet ?? null,
        sheet_status: 'not_found', term_status: 'not_found', review_status: 'pending', auto_applied: false,
      }, { client: trx })
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

    const record = await Database.from('bookrecords').where('id', row.bookrecords_id).andWhere('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).first()
    if (!record) throw new BadRequestException('Registro não encontrado', 404)
    const registry = await bookSideModelRegistry(user.companies_id, typebooksId, Number(record.book))
    if (registry.records.some((model) => ['queued', 'training'].includes(model.status))) throw new BadRequestException('Aguarde o treinamento deste livro terminar antes de alterar as revisões', 409)

    const image = await Database.from('indeximages')
      .where('companies_id', user.companies_id)
      .andWhere('typebooks_id', typebooksId)
      .andWhere('bookrecords_id', row.bookrecords_id)
      .andWhere('seq', row.seq)
      .andWhere('drive_file_id', row.drive_file_id)
      .first()

    if (!image) throw new BadRequestException('A imagem original da amostra foi alterada', 409)

    row.label = label
    row.reviewed_by = user.id
    row.reviewed_at = DateTime.local()
    await row.save()

    return ctx.response.ok({ id: row.id, label: row.label, reviewed_at: row.reviewed_at })
  }
}
