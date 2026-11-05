import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Typebook from 'App/Models/Typebook'
import Bookrecord from 'App/Models/Bookrecord'
import IndeximageOcrCheck from 'App/Models/IndeximageOcrCheck'
import IndeximageOcrEntity from 'App/Models/IndeximageOcrEntity'
import { loadBookSideVisualModel, bookSideVisualReadiness, extractBookSideVisualFeatures, predictBookSideVisual } from 'App/Services/ocr/bookSideVisualModel'
import { verifyPermission } from 'App/Services/util'
import {
  sendDownloadFileBuffer,
  sendListAllFilesMetadata,
  sendSearchFile,
} from 'App/Services/googleDrive/googledrive'
import {
  compareNumberStatus,
  compareTermStatus,
  detectImageSide,
  extractHeaderKeywordConference,
  extractTopIsolatedNumberConference,
  hashOcrSearchValue,
  normalizeOcrSearchValue,
} from 'App/Services/ocr/indexImageOcrConference'

export default class OcrConferencesController {
  private static cancelledProcesses = new Set<string>()

  private ocrConferencePermissiongroupId = 44

  private async assistedSideModel(companyId: number, typebookId: number, input: any) {
    const book = Number(input.bookstart ?? input.bookStart)
    const end = input.bookend ?? input.bookEnd
    if (!Number.isInteger(book) || book <= 0 || (end !== undefined && end !== null && end !== '' && Number(end) !== book)) {
      throw new BadRequestException('Selecione um único livro para usar o modelo visual assistido', 422)
    }
    const model = await loadBookSideVisualModel(companyId, typebookId, book)
    if (!model) throw new BadRequestException('Este livro ainda não tem modelo visual disponível', 422)
    const readiness = await bookSideVisualReadiness(model)
    if (!readiness.trainingUnchanged) throw new BadRequestException('As imagens ou marcações Frente/Verso usadas no treinamento mudaram ou não foram encontradas neste livro. Abra a revisão do livro para conferir o modelo', 422)
    if (!readiness.ready) throw new BadRequestException(`Validação do livro ${book}: ${readiness.correct} acertos em ${readiness.total} imagens (${readiness.sides.F} frentes e ${readiness.sides.V} versos). São necessárias pelo menos 40 validações independentes, com cinco de cada lado e sem erros. Abra a revisão do livro para consultar as pendências`, 422)
    return model
  }

  private ensureOcrConferenceAccess(authenticate: any, permissions: any[] = []) {
    if (!verifyPermission(Boolean(authenticate.superuser), permissions, this.ocrConferencePermissiongroupId)) {
      throw new BadRequestException('Acesso a conferência OCR não permitido', 403, 'ocr_conference_permission_required')
    }
  }

  private normalizeDriveFileName(value: string) {
    return String(value || '')
      .normalize('NFC')
      .trim()
      .toLowerCase()
  }

  private numberOrNull(value: any) {
    if (value === undefined || value === null) return null
    if (typeof value === 'string' && value.trim() === '') return null

    const number = Number(value)

    return Number.isFinite(number) ? number : null
  }

  private booleanValue(value: any) {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') return value === 'true' || value === '1'

    return Boolean(value)
  }

  private extractionRegion(value: any) {
    const region = String(value || 'auto_header').trim()
    const allowedRegions = [
      'auto_header',
      'upper_half',
      'full_page',
      'top_external',
      'top_right',
      'top_left',
      'top_full',
    ]

    return allowedRegions.includes(region) ? region : 'auto_header'
  }

  private layoutProfile(value: any) {
    const layoutProfile = String(value || 'header_keyword').trim()
    const allowedProfiles = ['header_keyword', 'top_isolated_number']

    return allowedProfiles.includes(layoutProfile) ? layoutProfile : 'header_keyword'
  }

  private keywordList(value: any) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || '').trim()).filter(Boolean)
    }

    return String(value || '')
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  private hasValue(value: any) {
    return value !== undefined && value !== null && String(value).trim() !== ''
  }

  private applyExactOrRangeFilter(query: any, column: string, startValue: any, endValue: any) {
    const start = this.numberOrNull(startValue)
    const end = this.numberOrNull(endValue)

    if (start !== null && end === null) query.where(column, start)
    else if (start !== null && end !== null) query.where(column, '>=', start)

    if (end !== null) query.where(column, '<=', end)
  }

  private applyBookrecordFilters(query: any, filters: any, tableAlias = '') {
    const column = (field: string) => tableAlias ? `${tableAlias}.${field}` : field

    this.applyExactOrRangeFilter(query, column('cod'), filters.codstart, filters.codend)
    this.applyExactOrRangeFilter(query, column('book'), filters.bookstart, filters.bookend)

    const sheetStart = this.numberOrNull(filters.sheetstart)
    const sheetEnd = this.numberOrNull(filters.sheetend)

    if (sheetStart === 0) {
      query.where((sheetQuery) => {
        sheetQuery.whereNull(column('sheet'))

        if (sheetEnd !== null) {
          sheetQuery.orWhere((rangeQuery) => {
            rangeQuery.where(column('sheet'), '>=', sheetStart).andWhere(column('sheet'), '<=', sheetEnd)
          })
        } else {
          sheetQuery.orWhere(column('sheet'), sheetStart)
        }
      })
    } else {
      this.applyExactOrRangeFilter(query, column('sheet'), filters.sheetstart, filters.sheetend)
    }

    const indexbookStart = this.numberOrNull(filters.indexbook)
    const indexbookEnd = this.numberOrNull(filters.indexbookend)

    if (indexbookStart === 0) {
      query.whereNull(column('indexbook'))
    } else if (indexbookStart !== null && indexbookEnd === null) {
      query.where(column('indexbook'), indexbookStart)
    } else if (indexbookStart !== null && indexbookEnd !== null) {
      query.whereBetween(column('indexbook'), [indexbookStart, indexbookEnd])
    }

    const approximateTerm = this.numberOrNull(filters.approximateterm)

    if (approximateTerm !== null) {
      query.whereRaw(
        `CONCAT('-', ${column('approximate_term')}, '-') LIKE ?`,
        [`%-${approximateTerm}-%`]
      )
    }

    if (this.hasValue(filters.year)) query.where(column('year'), filters.year)
    if (this.hasValue(filters.letter)) query.where(column('letter'), filters.letter)
    if (filters.side && filters.side !== 'any') query.where(column('side'), filters.side)
    if (this.hasValue(filters.obs)) query.where(column('obs'), filters.obs)
  }

  private confidenceLevel(confidence: any) {
    const value = Number(confidence || 0)

    if (value >= 0.92) return 'high'
    if (value >= 0.7) return 'medium'

    return 'low'
  }

  private countValue(row: any) {
    return Number(row?.total || row?.['count(*)'] || 0)
  }

  private bodyValue(body: any, camelKey: string, lowerKey: string) {
    return body[camelKey] !== undefined && body[camelKey] !== null && body[camelKey] !== ''
      ? body[camelKey]
      : body[lowerKey]
  }

  private processKey(companiesId: number, typebooksId: number, processId: string) {
    return `${companiesId}:${typebooksId}:${processId}`
  }

  private async reconcileProcessedSheetMatches(buildSelectionQuery: () => any, layoutProfile: string) {
    const rows = await buildSelectionQuery()
      .join('indeximage_ocr_checks as checks', (join) => {
        join
          .on('checks.bookrecords_id', 'indeximages.bookrecords_id')
          .andOn('checks.typebooks_id', 'indeximages.typebooks_id')
          .andOn('checks.companies_id', 'indeximages.companies_id')
          .andOn('checks.seq', 'indeximages.seq')
          .andOnVal('checks.layout_profile', layoutProfile)
      })
      .where('checks.sheet_status', 'divergent')
      .whereNotNull('checks.detected_sheet')
      .whereRaw('bookrecords.sheet = checks.detected_sheet')
      .select('checks.id')

    const ids = rows.map((row) => row.id).filter(Boolean)

    if (!ids.length) return 0

    await Database.rawQuery(
      `
        UPDATE indeximage_ocr_checks
        SET expected_sheet = detected_sheet,
            sheet_status = ?,
            updated_at = ?
        WHERE id IN (${ids.map(() => '?').join(', ')})
      `,
      ['match', DateTime.local().toSQL(), ...ids]
    )

    return ids.length
  }

  private async getTypebook(companiesId: number, typebooksId: number) {
    return Typebook
      .query()
      .preload('company')
      .where('companies_id', companiesId)
      .andWhere('id', typebooksId)
      .first()
  }

  public async index({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []
    this.ensureOcrConferenceAccess(authenticate, permissions)
    const typebooksId = Number(params.typebooks_id)
    const qs = request.qs()
    const page = Number(qs.page || 1)
    const perPage = Math.min(Math.max(Number(qs.perpage || qs.perPage || 20), 1), 200)
    const visualMode = qs.sidemodel === 'visual' || (qs.layoutprofile || qs.layoutProfile) === 'side_visual'
    const visualModel = visualMode ? await this.assistedSideModel(authenticate.companies_id, typebooksId, qs) : null
    const layoutProfile = this.layoutProfile(qs.layoutprofile || qs.layoutProfile)
    const sideChecks = visualModel ? 'visual_checks' : 'checks'
    const search = normalizeOcrSearchValue(String(qs.ocrsearch || ''))
    const searchDigits = String(qs.ocrsearch || '').replace(/\D/g, '')
    const searchHash = hashOcrSearchValue(searchDigits || search)

    if (!Number.isInteger(typebooksId) || typebooksId <= 0) {
      return response.status(400).send({ message: 'typebooks_id inválido' })
    }

    const query = Database
      .from('indeximages as indeximages')
      .join('bookrecords as bookrecords', (join) => {
        join
          .on('bookrecords.id', 'indeximages.bookrecords_id')
          .andOn('bookrecords.typebooks_id', 'indeximages.typebooks_id')
          .andOn('bookrecords.companies_id', 'indeximages.companies_id')
      })
      .leftJoin('indeximage_ocr_checks as checks', (join) => {
        join
          .on('checks.bookrecords_id', 'indeximages.bookrecords_id')
          .andOn('checks.typebooks_id', 'indeximages.typebooks_id')
          .andOn('checks.companies_id', 'indeximages.companies_id')
          .andOn('checks.seq', 'indeximages.seq')
          .andOnVal('checks.layout_profile', layoutProfile)
      })
      .where('indeximages.companies_id', authenticate.companies_id)
      .andWhere('indeximages.typebooks_id', typebooksId)
      .select(
        'checks.id',
        'checks.layout_profile',
        'checks.expected_sheet',
        'checks.detected_sheet',
        'checks.expected_term',
        'checks.detected_term',
        'checks.sheet_status',
        'checks.term_status',
        'checks.confidence',
        'checks.confidence_level',
        'checks.evidence_text',
        'checks.source',
        'checks.auto_applied',
        'checks.review_status',
        'checks.line_marker',
        'checks.processed_at',
        `${sideChecks}.detected_side as detected_side`,
        `${sideChecks}.side_confidence as side_confidence`,
        `${sideChecks}.side_evidence as side_evidence`,
        `${sideChecks}.side_processed_at as side_processed_at`,
        Database.raw(`CASE
          WHEN ${sideChecks}.side_processed_at IS NULL THEN NULL
          WHEN ${sideChecks}.detected_side IS NULL THEN 'not_found'
          WHEN bookrecords.side IS NULL THEN 'detected'
          WHEN bookrecords.side = ${sideChecks}.detected_side THEN 'match'
          ELSE 'divergent'
        END as side_status`),
        'bookrecords.id as bookrecord_id',
        'bookrecords.cod',
        'bookrecords.book',
        'bookrecords.sheet',
        'bookrecords.side',
        'bookrecords.approximate_term',
        'bookrecords.indexbook',
        'bookrecords.year',
        'bookrecords.letter',
        'bookrecords.obs',
        'indeximages.seq',
        'indeximages.file_name',
        'indeximages.ext'
      )
      .orderBy('bookrecords.book', 'asc')
      .orderBy('bookrecords.sheet', 'asc')
      .orderBy('bookrecords.cod', 'asc')
      .orderBy('indeximages.seq', 'asc')

    if (visualModel) query.leftJoin('indeximage_ocr_checks as visual_checks', (join) => {
      join.on('visual_checks.bookrecords_id', 'indeximages.bookrecords_id')
        .andOn('visual_checks.typebooks_id', 'indeximages.typebooks_id')
        .andOn('visual_checks.companies_id', 'indeximages.companies_id')
        .andOn('visual_checks.seq', 'indeximages.seq')
        .andOnVal('visual_checks.layout_profile', visualModel.version)
    })

    this.applyBookrecordFilters(query, qs, 'bookrecords')
    if (visualModel) query.andWhere('bookrecords.book', visualModel.book)

    if (qs.sheetstatus === 'not_processed') {
      query.where((notProcessedQuery) => {
        notProcessedQuery.whereNull('checks.id').orWhereNull('checks.processed_at')
      })
    } else if (qs.sheetstatus) query.andWhere('checks.sheet_status', qs.sheetstatus)

    if (qs.termstatus === 'not_processed') {
      query.where((notProcessedQuery) => {
        notProcessedQuery.whereNull('checks.id').orWhereNull('checks.processed_at')
      })
    } else if (qs.termstatus) query.andWhere('checks.term_status', qs.termstatus)

    if (qs.sidestatus === 'not_processed') query.whereNull(`${sideChecks}.side_processed_at`)
    else if (qs.sidestatus === 'not_found') query.whereNotNull(`${sideChecks}.side_processed_at`).whereNull(`${sideChecks}.detected_side`)
    else if (qs.sidestatus === 'detected') query.whereNotNull(`${sideChecks}.detected_side`).whereNull('bookrecords.side')
    else if (qs.sidestatus === 'match') query.whereNotNull(`${sideChecks}.detected_side`).whereRaw(`bookrecords.side = ${sideChecks}.detected_side`)
    else if (qs.sidestatus === 'divergent') query.whereNotNull(`${sideChecks}.detected_side`).whereRaw(`bookrecords.side <> ${sideChecks}.detected_side`)

    if (qs.confidencelevel) query.andWhere('checks.confidence_level', qs.confidencelevel)
    if (qs.reviewstatus === 'not_processed') {
      query.where((notProcessedQuery) => {
        notProcessedQuery.whereNull('checks.id').orWhereNull('checks.processed_at')
      })
    } else if (qs.reviewstatus) query.andWhere('checks.review_status', qs.reviewstatus)
    if (this.booleanValue(qs.linemarker || qs.lineMarker)) query.andWhere('checks.line_marker', true)

    if (search) {
      query.whereExists((entityQuery) => {
        entityQuery
          .from('indeximage_ocr_entities as entities')
          .whereRaw('entities.companies_id = indeximages.companies_id')
          .whereRaw('entities.typebooks_id = indeximages.typebooks_id')
          .whereRaw('entities.bookrecords_id = indeximages.bookrecords_id')
          .whereRaw('entities.seq = indeximages.seq')
          .andWhere((valueQuery) => {
            valueQuery.where('entities.normalized_value', 'like', `%${search}%`)

            if (searchDigits) {
              valueQuery.orWhere('entities.normalized_value', 'like', `%${searchDigits}%`)
            }

            if (searchHash) {
              valueQuery.orWhere('entities.normalized_hash', searchHash)
            }
          })
      })
    }

    const result = await query.paginate(page, perPage)

    return response.status(200).send(result)
  }

  public async sequenceDiagnostic({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []
    this.ensureOcrConferenceAccess(authenticate, permissions)

    const typebooksId = Number(params.typebooks_id)
    const book = Number(request.input('book'))
    const rawSheetStart = request.input('sheetStart')
    const rawSheetEnd = request.input('sheetEnd')
    const sheetStart = this.numberOrNull(rawSheetStart)
    const sheetEnd = this.numberOrNull(rawSheetEnd)
    const rawAfterRecordId = request.input('afterRecordId')
    const afterRecordId = this.numberOrNull(rawAfterRecordId)
    const rawSidePattern = request.input('sidePattern')
    const requestedSidePattern = typeof rawSidePattern === 'string' ? rawSidePattern.trim().toUpperCase() : ''
    const patternAnchorRecordId = this.numberOrNull(request.input('patternAnchorRecordId'))
    const rawPatternOffset = request.input('patternOffset')
    const requestedPatternOffset = this.numberOrNull(rawPatternOffset) ?? 0
    const patternPhaseStartRecordId = this.numberOrNull(request.input('patternPhaseStartRecordId'))
    const hasSheetStart = rawSheetStart !== undefined && rawSheetStart !== null && rawSheetStart !== ''
    const hasSheetEnd = rawSheetEnd !== undefined && rawSheetEnd !== null && rawSheetEnd !== ''
    if (!Number.isInteger(typebooksId) || typebooksId <= 0 || !Number.isInteger(book) || book <= 0) {
      return response.status(422).send({ message: 'Selecione um único livro válido para diagnosticar a sequência' })
    }
    if ((hasSheetStart && (sheetStart === null || !Number.isInteger(sheetStart) || sheetStart <= 0))
      || (hasSheetEnd && (sheetEnd === null || !Number.isInteger(sheetEnd) || sheetEnd <= 0))
      || (sheetStart !== null && sheetEnd !== null && sheetEnd < sheetStart)) {
      return response.status(422).send({ message: 'Informe um intervalo válido para folha inicial e final' })
    }
    if (rawAfterRecordId !== undefined && rawAfterRecordId !== null && rawAfterRecordId !== ''
      && (afterRecordId === null || !Number.isInteger(afterRecordId) || afterRecordId <= 0)) {
      return response.status(422).send({ message: 'O registro de retomada informado é inválido' })
    }
    if (rawSidePattern !== undefined && rawSidePattern !== null && rawSidePattern !== ''
      && (!/^[FV]{1,5}$/.test(requestedSidePattern) || patternAnchorRecordId === null || !Number.isInteger(patternAnchorRecordId) || patternAnchorRecordId <= 0)) {
      return response.status(422).send({ message: 'O padrão de lados informado é inválido' })
    }
    if (rawPatternOffset !== undefined && rawPatternOffset !== null && rawPatternOffset !== ''
      && (this.numberOrNull(rawPatternOffset) === null || requestedPatternOffset < 0 || !Number.isInteger(requestedPatternOffset))) {
      return response.status(422).send({ message: 'A fase do padrão de lados informada é inválida' })
    }
    const visualModel = await this.assistedSideModel(authenticate.companies_id, typebooksId, { bookStart: book, bookEnd: book })
    const typebook = await this.getTypebook(authenticate.companies_id, typebooksId)
    if (!typebook) return response.status(404).send({ message: 'Typebook não encontrado' })
    if (!typebook.company?.cloud) return response.status(422).send({ message: 'Empresa sem configuração de cloud' })

    const recordsQuery = Database.from('bookrecords as records')
      .leftJoin('indeximages as images', (join) => {
        join.on('images.bookrecords_id', 'records.id')
          .andOn('images.typebooks_id', 'records.typebooks_id')
          .andOn('images.companies_id', 'records.companies_id')
      })
      .where('records.companies_id', authenticate.companies_id)
      .andWhere('records.typebooks_id', typebooksId)
      .andWhere('records.book', book)
    if (sheetStart !== null) recordsQuery.andWhere('records.sheet', '>=', sheetStart)
    if (sheetEnd !== null) recordsQuery.andWhere('records.sheet', '<=', sheetEnd)
    const rows = await recordsQuery.select(
        'records.id as bookrecord_id', 'records.cod', 'records.book', 'records.sheet', 'records.side',
        'images.seq', 'images.ext', 'images.file_name', 'images.drive_file_id'
      )
      .orderBy('records.cod', 'asc')
      .orderBy('records.id', 'asc')
      .orderBy('images.seq', 'asc')

    const recordsById = new Map<number, any>()
    for (const row of rows) {
      const id = Number(row.bookrecord_id)
      if (!recordsById.has(id)) {
        recordsById.set(id, { bookrecord_id: id, cod: row.cod, book: row.book, sheet: row.sheet, side: row.side, images: [] })
      }
      if (row.seq !== null && row.seq !== undefined) recordsById.get(id).images.push(row)
    }

    const records = Array.from(recordsById.values())
    if (!records.length) return response.status(404).send({ message: `O livro ${book} não tem registros para conferir` })

    const imageForRecord = (record: any) => record.images.find((image: any) => {
      const ext = String(image.ext || '').toLowerCase()
      return image.drive_file_id && ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)
    }) || null
    const anchorIndex = records.findIndex((record) => imageForRecord(record))
    if (anchorIndex < 0) return response.status(422).send({ message: 'Não há imagens compatíveis neste livro para iniciar a conferência' })
    let sidePattern: string | null = null
    if (requestedSidePattern) {
      const calibration = records.slice(anchorIndex, anchorIndex + 15)
      const phaseStartIndex = patternPhaseStartRecordId === null ? -1 : records.findIndex((record) => record.bookrecord_id === patternPhaseStartRecordId)
      const savedSidesMatchPattern = calibration.length === 15
        && calibration.every((record, index) => {
          const offset = phaseStartIndex >= anchorIndex && anchorIndex + index >= phaseStartIndex ? requestedPatternOffset : 0
          return String(record.side || '').trim().toUpperCase() === requestedSidePattern[(index + offset) % requestedSidePattern.length]
        })
      if (records[anchorIndex].bookrecord_id !== patternAnchorRecordId || !savedSidesMatchPattern
        || requestedPatternOffset >= requestedSidePattern.length
        || (patternPhaseStartRecordId !== null && phaseStartIndex < anchorIndex)) {
        return response.status(409).send({ message: 'A amostra inicial mudou; execute novamente a calibração do padrão' })
      }
      sidePattern = requestedSidePattern
    }
    const currentPhaseStartIndex = patternPhaseStartRecordId === null
      ? -1 : records.findIndex((record) => record.bookrecord_id === patternPhaseStartRecordId)
    const resumeAfterIndex = afterRecordId === null ? -1 : records.findIndex((record) => record.bookrecord_id === afterRecordId)
    if (afterRecordId !== null && (resumeAfterIndex < anchorIndex || !imageForRecord(records[resumeAfterIndex]))) {
      return response.status(422).send({ message: 'O registro de retomada não pertence ao intervalo ou não tem imagem válida' })
    }
    const scanStartIndex = afterRecordId === null ? anchorIndex : resumeAfterIndex + 1
    const positionForIndex = (index: number) => index - anchorIndex + 1
    const initialSamplePositions = new Set<number>()
    for (let index = scanStartIndex; index < Math.min(records.length, scanStartIndex + 15); index++) initialSamplePositions.add(index)
    const checkpointGroups: number[][] = []
    for (let groupStart = scanStartIndex + 15; groupStart < records.length; groupStart += 15) {
      checkpointGroups.push(Array.from({ length: Math.min(3, records.length - groupStart) }, (_value, offset) => groupStart + offset))
    }
    const streaming = this.booleanValue(request.input('streamProgress'))
    const isClientDisconnected = () => streaming && response.response.destroyed
    const result = {
      book,
      sheet_start: sheetStart,
      sheet_end: sheetEnd,
      anchor_cod: records[scanStartIndex]?.cod ?? null,
      resumed_after_cod: afterRecordId === null ? null : records[resumeAfterIndex].cod,
      pattern_anchor_record_id: records[anchorIndex].bookrecord_id,
      side_pattern: null as string | null,
      side_pattern_offset: requestedPatternOffset,
      pattern_phase_start_record_id: patternPhaseStartRecordId,
      pattern_calibrated_positions: 0,
      can_propagate_pattern: false,
      proposed_side_changes: [] as any[],
      correction_pattern_offset: null as number | null,
      correction_side_pattern: null as string | null,
      correction_resume_after_record_id: null as number | null,
      model_version: visualModel.version,
      total_positions: records.length - scanStartIndex,
      initial_sample_positions: initialSamplePositions.size,
      sampled_positions: 0,
      inspected_positions: 0,
      additional_images_not_counted: records.slice(scanStartIndex).reduce((sum, record) => sum + Math.max(0, record.images.length - 1), 0),
      stopped_at_first_error: false,
      first_error: null as any,
      diagnostics: [] as any[],
      errors: [] as any[],
    }
    const sendProgress = (completed: number) => {
      if (streaming && !response.response.destroyed && !response.response.writableEnded) {
        response.response.write(`${JSON.stringify({ type: 'progress', total: result.total_positions, completed })}\n`)
      }
    }
    if (streaming) {
      response.header('Content-Type', 'application/x-ndjson; charset=utf-8')
        .header('Cache-Control', 'no-store').header('X-Accel-Buffering', 'no').flushHeaders(200)
      sendProgress(0)
    }

    const analyzed = new Map<number, any>()
    let completed = 0
    const expectedSideWithPhase = (index: number, offset: number, phaseStartIndex: number) => sidePattern
      ? sidePattern[((index - anchorIndex) + (phaseStartIndex >= 0 && index >= phaseStartIndex ? offset : 0)) % sidePattern.length]
      : null
    const expectedSideAtIndex = (index: number) => expectedSideWithPhase(index, requestedPatternOffset, currentPhaseStartIndex)
    const analyzePosition = async (index: number, sampleType: string) => {
      if (analyzed.has(index)) return analyzed.get(index)
      if (isClientDisconnected()) return null
      const record = records[index]
      const image = imageForRecord(record)
      const savedSide = String(record.side || '').trim().toUpperCase() || null
      const diagnostic: any = {
        position: positionForIndex(index),
        bookrecord_id: record.bookrecord_id,
        cod: record.cod,
        book: record.book,
        sheet: record.sheet,
        seq: image?.seq ?? null,
        file_name: image?.file_name ?? null,
        image_count: record.images.length,
        sample_type: sampleType,
        expected_side: expectedSideAtIndex(index),
        saved_side: ['F', 'V'].includes(savedSide || '') ? savedSide : null,
        side: ['F', 'V'].includes(savedSide || '') ? savedSide : null,
        detected_side: null,
      }
      try {
        if (!image) throw new Error('Registro sem imagem compatível disponível no Drive')
        const imageBuffer = await sendDownloadFileBuffer(image.drive_file_id, typebook.company.cloud)
        if (isClientDisconnected()) return null
        diagnostic.detected_side = predictBookSideVisual(
          visualModel,
          (await extractBookSideVisualFeatures(imageBuffer, visualModel.extractor_sha256)).features
        ).side
      } catch (error) {
        diagnostic.error = error?.message || 'Erro ao analisar a imagem'
        result.errors.push({ position: diagnostic.position, cod: diagnostic.cod, message: diagnostic.error })
      }
      diagnostic.detected_matches_saved = diagnostic.detected_side && diagnostic.saved_side ? diagnostic.detected_side === diagnostic.saved_side : null
      diagnostic.detected_matches_expected = diagnostic.expected_side && diagnostic.detected_side ? diagnostic.expected_side === diagnostic.detected_side : null
      diagnostic.saved_matches_expected = diagnostic.expected_side && diagnostic.saved_side ? diagnostic.expected_side === diagnostic.saved_side : null
      analyzed.set(index, diagnostic)
      if (initialSamplePositions.has(index) || sampleType === 'Checkpoint de 3') result.sampled_positions++
      result.inspected_positions = analyzed.size
      completed = analyzed.size
      sendProgress(completed)
      return diagnostic
    }

    const isConforming = (diagnostic: any) => sidePattern
      ? diagnostic.detected_matches_expected === true && diagnostic.saved_matches_expected === true
      : diagnostic.detected_matches_saved === true
    const divergenceReason = (diagnostic: any) => diagnostic.error
      || (!diagnostic.detected_side ? 'O modelo não conseguiu identificar o lado da imagem'
        : !diagnostic.saved_side ? 'O registro não tem lado cadastrado válido'
          : sidePattern && diagnostic.detected_side !== diagnostic.expected_side ? 'O lado detectado diverge do ciclo calibrado'
            : sidePattern && diagnostic.saved_side !== diagnostic.expected_side ? 'O lado cadastrado diverge do ciclo calibrado'
              : 'O lado detectado diverge do lado cadastrado')
    let lastVerifiedIndex = scanStartIndex - 1
    let firstErrorIndex: number | null = null
    let firstErrorReason = ''

    for (const index of initialSamplePositions) {
      if (isClientDisconnected()) return
      const diagnostic = await analyzePosition(index, 'Amostra sequencial inicial')
      if (isClientDisconnected()) return
      if (!isConforming(diagnostic) && firstErrorIndex === null) {
        firstErrorIndex = index
        firstErrorReason = divergenceReason(diagnostic)
      }
      if (firstErrorIndex === null) lastVerifiedIndex = index
    }

    if (!sidePattern && scanStartIndex === anchorIndex && initialSamplePositions.size === 15) {
      const calibratedSides = Array.from(initialSamplePositions).map((index) => analyzed.get(index)?.detected_side)
      for (let period = 1; period <= Math.floor(calibratedSides.length / 3); period++) {
        if (calibratedSides.every((side, index) => side && side === calibratedSides[index % period])) {
          sidePattern = calibratedSides.slice(0, period).join('')
          break
        }
      }
    }
    if (sidePattern) {
      result.side_pattern = sidePattern
      result.pattern_calibrated_positions = 15
      for (const [index, diagnostic] of analyzed) {
        diagnostic.expected_side = expectedSideAtIndex(index)
        diagnostic.detected_matches_expected = diagnostic.detected_side ? diagnostic.detected_side === diagnostic.expected_side : null
        diagnostic.saved_matches_expected = diagnostic.saved_side ? diagnostic.saved_side === diagnostic.expected_side : null
      }
    }

    if (firstErrorIndex === null) {
      for (const group of checkpointGroups) {
        if (isClientDisconnected()) return
        let failedIndex: number | null = null
        for (const index of group) {
          if (isClientDisconnected()) return
          const diagnostic = await analyzePosition(index, 'Checkpoint de 3')
          if (isClientDisconnected()) return
          if (!isConforming(diagnostic)) {
            failedIndex = index
            firstErrorReason = divergenceReason(diagnostic)
            break
          }
        }
        if (failedIndex === null) {
          lastVerifiedIndex = group[group.length - 1]
          continue
        }

        for (let index = lastVerifiedIndex + 1; index <= failedIndex; index++) {
          if (isClientDisconnected()) return
          const diagnostic = await analyzePosition(index, 'Investigação do intervalo')
          if (isClientDisconnected()) return
          if (isConforming(diagnostic)) continue
          firstErrorIndex = index
          firstErrorReason = divergenceReason(diagnostic)
          break
        }
        break
      }
    }

    if (firstErrorIndex !== null) {
      if (isClientDisconnected()) return
      result.stopped_at_first_error = true
      const firstError = await analyzePosition(firstErrorIndex, 'Primeiro erro')
      if (isClientDisconnected()) return
      result.first_error = { ...firstError, reason: firstErrorReason }
      for (let neighbor = firstErrorIndex - 3; neighbor <= firstErrorIndex + 3; neighbor++) {
        if (isClientDisconnected()) return
        if (neighbor < anchorIndex || neighbor >= records.length) continue
        await analyzePosition(neighbor, 'Imagem vizinha')
      }

      const scorePatternOffset = (offset: number) => Array.from({ length: sidePattern?.length || 0 }, (_value, step) => {
        const index = firstErrorIndex! + step
        const diagnostic = analyzed.get(index)
        return diagnostic?.detected_side === expectedSideWithPhase(index, offset, firstErrorIndex!) ? 1 : 0
      }).reduce((sum, value) => sum + value, 0)
      const currentOffsetAtError = currentPhaseStartIndex >= 0 && firstErrorIndex >= currentPhaseStartIndex
        ? requestedPatternOffset : 0
      const bestPatternOffset = sidePattern
        ? Array.from({ length: sidePattern.length }, (_value, offset) => offset)
          .sort((left, right) => scorePatternOffset(right) - scorePatternOffset(left)
            || Number(right === currentOffsetAtError) - Number(left === currentOffsetAtError))[0]
        : null
      const supportsPattern = (index: number, offset: number) => {
        const diagnostic = analyzed.get(index)
        const expectedSide = expectedSideWithPhase(index, offset, firstErrorIndex!)
        return Boolean(diagnostic && expectedSide && diagnostic.detected_side === expectedSide && diagnostic.saved_side !== expectedSide)
      }
      if (result.pattern_calibrated_positions === 15 && firstErrorIndex + 1 < records.length
        && bestPatternOffset !== null
        && supportsPattern(firstErrorIndex, bestPatternOffset) && supportsPattern(firstErrorIndex + 1, bestPatternOffset)) {
        const correctionStartIndex = firstErrorIndex
        result.can_propagate_pattern = true
        result.correction_pattern_offset = bestPatternOffset
        const phase = (correctionStartIndex - anchorIndex + bestPatternOffset) % sidePattern!.length
        result.correction_side_pattern = sidePattern!.slice(phase) + sidePattern!.slice(0, phase)
        result.correction_resume_after_record_id = correctionStartIndex > anchorIndex
          ? records[correctionStartIndex - 1].bookrecord_id
          : null
        result.proposed_side_changes = records.slice(correctionStartIndex).flatMap((record, offset) => {
          const index = correctionStartIndex + offset
          const toSide = expectedSideWithPhase(index, bestPatternOffset, correctionStartIndex)
          const fromSide = String(record.side || '').trim().toUpperCase() || null
          return toSide && fromSide !== toSide ? [{
            position: positionForIndex(index),
            bookrecord_id: record.bookrecord_id,
            cod: record.cod,
            sheet: record.sheet,
            from_side: ['F', 'V'].includes(fromSide || '') ? fromSide : null,
            to_side: toSide,
          }] : []
        })
      }
    }
    result.diagnostics = Array.from(analyzed.entries())
      .filter(([index]) => firstErrorIndex === null || Math.abs(index - firstErrorIndex) <= 3)
      .sort(([a], [b]) => a - b)
      .map(([, diagnostic]) => diagnostic)

    if (streaming) {
      if (!response.response.destroyed && !response.response.writableEnded) {
        response.response.end(`${JSON.stringify({ type: 'result', data: result })}\n`)
      }
      return
    }
    return response.status(200).send(result)
  }

  public async applySequenceSidePattern({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []
    this.ensureOcrConferenceAccess(authenticate, permissions)

    const typebooksId = Number(params.typebooks_id)
    const book = Number(request.input('book'))
    const sheetStart = this.numberOrNull(request.input('sheetStart'))
    const sheetEnd = this.numberOrNull(request.input('sheetEnd'))
    const startRecordId = this.numberOrNull(request.input('startRecordId'))
    const patternAnchorRecordId = this.numberOrNull(request.input('patternAnchorRecordId'))
    const patternPhaseStartRecordId = this.numberOrNull(request.input('patternPhaseStartRecordId'))
    const patternOffset = this.numberOrNull(request.input('patternOffset')) ?? 0
    const pattern = String(request.input('sidePattern') || '').trim().toUpperCase()
    const previewChanges = request.input('changes')

    if (!Number.isInteger(typebooksId) || typebooksId <= 0 || !Number.isInteger(book) || book <= 0
      || !Number.isInteger(startRecordId) || !Number.isInteger(patternAnchorRecordId)
      || !/^[FV]{1,5}$/.test(pattern) || !Array.isArray(previewChanges)
      || !Number.isInteger(patternOffset) || patternOffset < 0 || patternOffset >= pattern.length
      || patternPhaseStartRecordId !== startRecordId) {
      return response.status(422).send({ message: 'Dados inválidos para aplicar a sequência de lados' })
    }
    if ((sheetStart !== null && (!Number.isInteger(sheetStart) || sheetStart <= 0))
      || (sheetEnd !== null && (!Number.isInteger(sheetEnd) || sheetEnd <= 0))
      || (sheetStart !== null && sheetEnd !== null && sheetEnd < sheetStart)) {
      return response.status(422).send({ message: 'Informe um intervalo válido para folha inicial e final' })
    }

    await this.assistedSideModel(authenticate.companies_id, typebooksId, { bookStart: book, bookEnd: book })
    const recordsQuery = Database.from('bookrecords')
      .where('companies_id', authenticate.companies_id)
      .andWhere('typebooks_id', typebooksId)
      .andWhere('book', book)
    if (sheetStart !== null) recordsQuery.andWhere('sheet', '>=', sheetStart)
    if (sheetEnd !== null) recordsQuery.andWhere('sheet', '<=', sheetEnd)
    const records = await recordsQuery.select('id', 'cod', 'sheet', 'side').orderBy('cod', 'asc').orderBy('id', 'asc')
    const anchorIndex = records.findIndex((record) => Number(record.id) === patternAnchorRecordId)
    const startIndex = records.findIndex((record) => Number(record.id) === startRecordId)
    if (anchorIndex < 0 || startIndex < anchorIndex) {
      return response.status(409).send({ message: 'O ponto inicial ou a amostra de calibração mudou; execute o diagnóstico novamente' })
    }
    const calibration = records.slice(anchorIndex, anchorIndex + 15)
    if (calibration.length !== 15) {
      return response.status(409).send({ message: 'A amostra de calibração não está mais disponível; execute o diagnóstico novamente' })
    }

    const expectedSideAt = (index: number) => pattern[((index - anchorIndex) + (index >= startIndex ? patternOffset : 0)) % pattern.length]
    const expectedAtStart = expectedSideAt(startIndex)
    const expectedAtNext = expectedSideAt(startIndex + 1)
    if (String(records[startIndex].side || '').trim().toUpperCase() === expectedAtStart
      || !records[startIndex + 1]
      || String(records[startIndex + 1].side || '').trim().toUpperCase() === expectedAtNext) {
      return response.status(409).send({ message: 'A divergência contínua não confere mais com a prévia; execute o diagnóstico novamente' })
    }

    const changes = records.slice(startIndex).flatMap((record, offset) => {
      const index = startIndex + offset
      const fromSide = String(record.side || '').trim().toUpperCase() || null
      const toSide = expectedSideAt(index)
      return fromSide !== toSide ? [{ id: Number(record.id), from_side: fromSide, to_side: toSide }] : []
    })
    const previewMatches = changes.length === previewChanges.length && changes.every((change, index) => {
      const preview = previewChanges[index]
      const previewFromSide = String(preview.from_side || '').trim().toUpperCase() || null
      return Number(preview.bookrecord_id) === change.id
        && previewFromSide === change.from_side
        && String(preview.to_side || '').trim().toUpperCase() === change.to_side
    })
    if (!changes.length || !previewMatches) {
      return response.status(409).send({ message: 'A prévia mudou; execute o diagnóstico novamente antes de aplicar' })
    }

    const now = DateTime.local().toSQL({ includeOffset: false })
    await Database.transaction(async (trx) => {
      const currentRows = await Database.from('bookrecords').useTransaction(trx)
        .where('companies_id', authenticate.companies_id)
        .andWhere('typebooks_id', typebooksId)
        .andWhere('book', book)
        .whereIn('id', changes.map((change) => change.id))
        .forUpdate()
        .select('id', 'side')
      const currentById = new Map(currentRows.map((row) => [Number(row.id), String(row.side || '').trim().toUpperCase() || null]))
      if (changes.some((change) => currentById.get(change.id) !== change.from_side)) {
        throw new BadRequestException('Algum lado mudou após a prévia; execute o diagnóstico novamente', 409)
      }
      for (const side of ['F', 'V']) {
        const ids = changes.filter((change) => change.to_side === side).map((change) => change.id)
        if (!ids.length) continue
        await Database.from('bookrecords').useTransaction(trx)
          .where('companies_id', authenticate.companies_id)
          .andWhere('typebooks_id', typebooksId)
          .andWhere('book', book)
          .whereIn('id', ids)
          .update({ side, updated_at: now })
      }
    })

    return response.status(200).send({
      applied: changes.length,
      start_cod: records[startIndex].cod,
      end_cod: records[records.length - 1].cod,
      side_pattern: pattern,
      side_pattern_offset: patternOffset,
      pattern_phase_start_record_id: patternPhaseStartRecordId,
      resume_after_record_id: records[startIndex - 1]?.id ?? null,
    })
  }

  public async applyDetectedSequenceSides({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []
    this.ensureOcrConferenceAccess(authenticate, permissions)

    const typebooksId = Number(params.typebooks_id)
    const book = Number(request.input('book'))
    const sheetStart = this.numberOrNull(request.input('sheetStart'))
    const sheetEnd = this.numberOrNull(request.input('sheetEnd'))
    const requestedChanges = request.input('records')
    if (!Number.isInteger(typebooksId) || typebooksId <= 0 || !Number.isInteger(book) || book <= 0
      || !Array.isArray(requestedChanges) || !requestedChanges.length) {
      return response.status(422).send({ message: 'Selecione registros detectados válidos para igualar os lados' })
    }
    if ((sheetStart !== null && (!Number.isInteger(sheetStart) || sheetStart <= 0))
      || (sheetEnd !== null && (!Number.isInteger(sheetEnd) || sheetEnd <= 0))
      || (sheetStart !== null && sheetEnd !== null && sheetEnd < sheetStart)) {
      return response.status(422).send({ message: 'Informe um intervalo válido para folha inicial e final' })
    }

    const changes = requestedChanges.map((item: any) => ({
      id: Number(item?.bookrecord_id),
      fromSide: item?.saved_side === null || item?.saved_side === undefined || item?.saved_side === ''
        ? null : String(item.saved_side).trim().toUpperCase(),
      toSide: String(item?.detected_side || '').trim().toUpperCase(),
    }))
    const ids = changes.map((change: any) => change.id)
    if (changes.some((change: any) => !Number.isInteger(change.id) || change.id <= 0
      || (change.fromSide !== null && !['F', 'V'].includes(change.fromSide))
      || !['F', 'V'].includes(change.toSide)) || new Set(ids).size !== ids.length) {
      return response.status(422).send({ message: 'A lista de lados detectados contém valores inválidos ou repetidos' })
    }

    const recordsQuery = Database.from('bookrecords')
      .where('companies_id', authenticate.companies_id)
      .andWhere('typebooks_id', typebooksId)
      .andWhere('book', book)
      .whereIn('id', ids)
    if (sheetStart !== null) recordsQuery.andWhere('sheet', '>=', sheetStart)
    if (sheetEnd !== null) recordsQuery.andWhere('sheet', '<=', sheetEnd)
    const records = await recordsQuery.select('id', 'side')
    if (records.length !== changes.length) {
      return response.status(409).send({ message: 'Algum registro não pertence ao livro e intervalo selecionados' })
    }

    const currentById = new Map(records.map((record) => [Number(record.id), String(record.side || '').trim().toUpperCase() || null]))
    if (changes.some((change: any) => currentById.get(change.id) !== change.fromSide)) {
      return response.status(409).send({ message: 'Algum lado mudou desde o diagnóstico; execute a conferência novamente' })
    }
    const updates = changes.filter((change: any) => change.fromSide !== change.toSide)
    if (!updates.length) return response.status(200).send({ applied: 0 })

    const now = DateTime.local().toSQL({ includeOffset: false })
    await Database.transaction(async (trx) => {
      const lockedRows = await Database.from('bookrecords').useTransaction(trx)
        .where('companies_id', authenticate.companies_id)
        .andWhere('typebooks_id', typebooksId)
        .andWhere('book', book)
        .whereIn('id', updates.map((change: any) => change.id))
        .forUpdate()
        .select('id', 'side')
      const lockedById = new Map(lockedRows.map((record) => [Number(record.id), String(record.side || '').trim().toUpperCase() || null]))
      if (updates.some((change: any) => lockedById.get(change.id) !== change.fromSide)) {
        throw new BadRequestException('Algum lado mudou durante a atualização; execute a conferência novamente', 409)
      }
      for (const side of ['F', 'V']) {
        const sideIds = updates.filter((change: any) => change.toSide === side).map((change: any) => change.id)
        if (!sideIds.length) continue
        await Database.from('bookrecords').useTransaction(trx)
          .where('companies_id', authenticate.companies_id)
          .andWhere('typebooks_id', typebooksId)
          .andWhere('book', book)
          .whereIn('id', sideIds)
          .update({ side, updated_at: now })
      }
    })

    return response.status(200).send({ applied: updates.length })
  }

  public async entities({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []
    this.ensureOcrConferenceAccess(authenticate, permissions)
    const typebooksId = Number(params.typebooks_id)
    const qs = request.qs()
    const bookrecordsId = Number(qs.bookrecords_id || qs.bookrecordId)
    const sequence = Number(qs.seq)
    const entityType = String(qs.entity_type || qs.entityType || '').trim()
    const allowedEntityTypes = ['name', 'document', 'sheet', 'term']

    if (!Number.isInteger(typebooksId) || typebooksId <= 0) {
      return response.status(400).send({ message: 'typebooks_id inválido' })
    }

    if (!Number.isInteger(bookrecordsId) || bookrecordsId <= 0) {
      return response.status(400).send({ message: 'bookrecords_id inválido' })
    }

    const query = IndeximageOcrEntity
      .query()
      .where('companies_id', authenticate.companies_id)
      .andWhere('typebooks_id', typebooksId)
      .andWhere('bookrecords_id', bookrecordsId)

    if (Number.isInteger(sequence) && sequence >= 0) query.andWhere('seq', sequence)
    if (allowedEntityTypes.includes(entityType)) query.andWhere('entity_type', entityType)

    const entities = await query
      .orderBy('seq', 'asc')
      .orderBy('entity_type', 'asc')
      .orderBy('confidence', 'desc')
      .orderBy('id', 'asc')
      .limit(200)

    return response.status(200).send({ data: entities })
  }

  public async process({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []
    this.ensureOcrConferenceAccess(authenticate, permissions)
    const typebooksId = Number(params.typebooks_id)
    const input = { ...request.qs(), ...request.body() }
    const body = {
      layoutProfile: input.layoutProfile,
      extractionRegion: input.extractionRegion || input.extractionregion,
      positiveKeywords: input.positiveKeywords || input.positivekeywords,
      negativeKeywords: input.negativeKeywords || input.negativekeywords,
      limit: input.limit,
      force: input.force,
      sideOnly: input.sideOnly || input.sideonly,
      fileName: input.fileName,
      bookrecords_id: input.bookrecords_id,
      seq: input.seq,
      codStart: input.codStart,
      codEnd: input.codEnd,
      bookStart: input.bookStart,
      bookEnd: input.bookEnd,
      sheetStart: input.sheetStart,
      sheetEnd: input.sheetEnd,
      codstart: input.codstart,
      codend: input.codend,
      bookstart: input.bookstart,
      bookend: input.bookend,
      sheetstart: input.sheetstart,
      sheetend: input.sheetend,
      indexbook: input.indexbook,
      indexbookEnd: input.indexbookEnd,
      indexbookend: input.indexbookend,
      approximateTerm: input.approximateTerm,
      approximateterm: input.approximateterm,
      year: input.year,
      letter: input.letter,
      side: input.side,
      sideStatus: input.sideStatus || input.sidestatus,
      obs: input.obs,
      lineMarker: input.lineMarker !== undefined ? input.lineMarker : input.linemarker,
    }
    const visualMode = input.sideModel === 'visual' || body.layoutProfile === 'side_visual'
    if (visualMode && !this.booleanValue(body.sideOnly)) return response.status(422).send({ message: 'O perfil visual processa somente lados; use Conferir lados' })
    const visualModel = visualMode ? await this.assistedSideModel(authenticate.companies_id, typebooksId, body) : null
    const layoutProfile = visualModel?.version || this.layoutProfile(body.layoutProfile)
    const extractionOptions = {
      extractionRegion: this.extractionRegion(body.extractionRegion),
      positiveKeywords: this.keywordList(body.positiveKeywords),
      negativeKeywords: this.keywordList(body.negativeKeywords),
    }
    const limit = Math.min(Math.max(Number(body.limit || 20), 1), 100)
    const force = this.booleanValue(body.force)
    const sideOnly = this.booleanValue(body.sideOnly)
    const singleFileName = String(body.fileName || '').trim()
    const bookrecordsId = Number(body.bookrecords_id)
    const sequence = Number(body.seq)
    const processId = String(input.processId || input.processid || '').trim()
    const cancelKey = processId ? this.processKey(authenticate.companies_id, typebooksId, processId) : ''
    const isCancelled = () => cancelKey && OcrConferencesController.cancelledProcesses.has(cancelKey)

    if (cancelKey) OcrConferencesController.cancelledProcesses.delete(cancelKey)

    if (!Number.isInteger(typebooksId) || typebooksId <= 0) {
      return response.status(400).send({ message: 'typebooks_id inválido' })
    }

    const typebook = await this.getTypebook(authenticate.companies_id, typebooksId)

    if (!typebook) return response.status(404).send({ message: 'Typebook não encontrado' })
    if (!typebook.path) return response.status(422).send({ message: 'Typebook sem caminho da pasta configurado' })
    if (!typebook.company?.cloud) return response.status(422).send({ message: 'Empresa sem configuração de cloud' })

    const folder = await sendSearchFile(typebook.path, typebook.company.cloud)

    if (!Array.isArray(folder) || !folder[0]?.id) {
      return response.status(404).send({
        message: 'Pasta do Google Drive não encontrada',
        path: typebook.path,
      })
    }

    const filterValues = {
      codstart: this.bodyValue(body, 'codStart', 'codstart'),
      codend: this.bodyValue(body, 'codEnd', 'codend'),
      bookstart: this.bodyValue(body, 'bookStart', 'bookstart'),
      bookend: this.bodyValue(body, 'bookEnd', 'bookend'),
      sheetstart: this.bodyValue(body, 'sheetStart', 'sheetstart'),
      sheetend: this.bodyValue(body, 'sheetEnd', 'sheetend'),
      indexbook: body.indexbook,
      indexbookend: this.bodyValue(body, 'indexbookEnd', 'indexbookend'),
      approximateterm: this.bodyValue(body, 'approximateTerm', 'approximateterm'),
      year: body.year,
      letter: body.letter,
      side: body.side,
      obs: body.obs,
      lineMarker: body.lineMarker,
    }
    const buildSelectionQuery = () => {
      const selectionQuery = Database
        .from('indeximages as indeximages')
        .join('bookrecords as bookrecords', (join) => {
          join
            .on('bookrecords.id', 'indeximages.bookrecords_id')
            .andOn('bookrecords.typebooks_id', 'indeximages.typebooks_id')
            .andOn('bookrecords.companies_id', 'indeximages.companies_id')
        })
        .where('indeximages.companies_id', authenticate.companies_id)
        .andWhere('indeximages.typebooks_id', typebooksId)

      this.applyBookrecordFilters(selectionQuery, filterValues, 'bookrecords')
      if (visualModel) selectionQuery.andWhere('bookrecords.book', visualModel.book)

      if (sideOnly && body.sideStatus) {
        selectionQuery.leftJoin('indeximage_ocr_checks as side_checks', (join) => {
          join
            .on('side_checks.bookrecords_id', 'indeximages.bookrecords_id')
            .andOn('side_checks.typebooks_id', 'indeximages.typebooks_id')
            .andOn('side_checks.companies_id', 'indeximages.companies_id')
            .andOn('side_checks.seq', 'indeximages.seq')
            .andOnVal('side_checks.layout_profile', layoutProfile)
        })

        if (body.sideStatus === 'not_processed') selectionQuery.whereNull('side_checks.side_processed_at')
        else if (body.sideStatus === 'not_found') selectionQuery.whereNotNull('side_checks.side_processed_at').whereNull('side_checks.detected_side')
        else if (body.sideStatus === 'detected') selectionQuery.whereNotNull('side_checks.detected_side').whereNull('bookrecords.side')
        else if (body.sideStatus === 'match') selectionQuery.whereNotNull('side_checks.detected_side').whereRaw('bookrecords.side = side_checks.detected_side')
        else if (body.sideStatus === 'divergent') selectionQuery.whereNotNull('side_checks.detected_side').whereRaw('bookrecords.side <> side_checks.detected_side')
      }

      if (this.booleanValue(filterValues.lineMarker)) {
        selectionQuery.whereExists((checkQuery) => {
          checkQuery
            .from('indeximage_ocr_checks as marker_checks')
            .whereRaw('marker_checks.companies_id = indeximages.companies_id')
            .whereRaw('marker_checks.typebooks_id = indeximages.typebooks_id')
            .whereRaw('marker_checks.bookrecords_id = indeximages.bookrecords_id')
            .whereRaw('marker_checks.seq = indeximages.seq')
            .where('marker_checks.layout_profile', layoutProfile)
            .where('marker_checks.line_marker', true)
        })
      }

      if (singleFileName) selectionQuery.andWhere('indeximages.file_name', singleFileName)
      if (Number.isInteger(bookrecordsId) && bookrecordsId > 0) selectionQuery.andWhere('indeximages.bookrecords_id', bookrecordsId)
      if (Number.isInteger(sequence) && sequence >= 0) selectionQuery.andWhere('indeximages.seq', sequence)

      return selectionQuery
    }
    const applyPendingFilter = (selectionQuery: any) => {
      return selectionQuery.whereNotExists((checkQuery) => {
        checkQuery
          .from('indeximage_ocr_checks as checks')
          .whereRaw('checks.companies_id = indeximages.companies_id')
          .whereRaw('checks.typebooks_id = indeximages.typebooks_id')
          .whereRaw('checks.bookrecords_id = indeximages.bookrecords_id')
          .whereRaw('checks.seq = indeximages.seq')
          .where('checks.layout_profile', layoutProfile)
          .whereNotNull(sideOnly ? 'checks.side_processed_at' : 'checks.processed_at')
      })
    }
    const reconciledSheetMatches = sideOnly ? 0 : await this.reconcileProcessedSheetMatches(buildSelectionQuery, layoutProfile)
    const matchingBeforePending = this.countValue(await buildSelectionQuery().count('* as total').first())
    const matchingAfterPending = force
      ? matchingBeforePending
      : this.countValue(await applyPendingFilter(buildSelectionQuery()).count('* as total').first())
    const query = buildSelectionQuery()
      .select(
        'indeximages.companies_id',
        'indeximages.typebooks_id',
        'indeximages.bookrecords_id',
        'indeximages.seq',
        'indeximages.file_name',
        'indeximages.drive_file_id',
        'bookrecords.book as index_book',
        'bookrecords.book as record_book',
        'bookrecords.sheet as record_sheet',
        'bookrecords.approximate_term as record_approximate_term'
      )
      .orderBy('bookrecords.book', 'asc')
      .orderBy('bookrecords.sheet', 'asc')
      .orderBy('bookrecords.cod', 'asc')
      .orderBy('indeximages.seq', 'asc')
      .limit(limit)

    if (!force) {
      applyPendingFilter(query)
    }

    const indeximages = await query
    const driveFileIdsFound = indeximages.filter((item) => item.drive_file_id).length
    const needsDriveNameLookup = indeximages.some((item) => !item.drive_file_id)
    const result = {
      selected: indeximages.length,
      total_filter_rows: matchingBeforePending,
      drive_files_found: driveFileIdsFound,
      reconciled_sheet_matches: reconciledSheetMatches,
      process_id: processId || null,
      cancelled: false,
      processed: 0,
      skipped: 0,
      errors: [] as any[],
      checks: [] as any[],
      debug: {
        version: 'ocr-process-2026-10-22-layout-01',
        layout_profile: layoutProfile,
        force,
        side_only: sideOnly,
        limit,
        matching_before_pending: matchingBeforePending,
        matching_after_pending: matchingAfterPending,
        reconciled_sheet_matches: reconciledSheetMatches,
        drive_lookup_by_name: needsDriveNameLookup,
        extraction_options: extractionOptions,
        filters: filterValues,
      },
    }

    if (!indeximages.length) {
      return response.status(200).send(result)
    }

    const bookNumbers = Array.from(
      new Set(
        indeximages
          .map((item) => Number(item.record_book || item.index_book))
          .filter((item) => Number.isInteger(item) && item > 0)
      )
    )
    const driveFiles = needsDriveNameLookup
      ? singleFileName
        ? await sendSearchFile(singleFileName, typebook.company.cloud, folder[0].id)
        : await sendListAllFilesMetadata(typebook.company.cloud, folder as any, bookNumbers as any)
      : []
    const driveFilesByName = new Map<string, any>()

    for (const file of driveFiles || []) {
      if (file?.name) driveFilesByName.set(this.normalizeDriveFileName(file.name), file)
    }

    result.drive_files_found = driveFileIdsFound + driveFilesByName.size

    const streamProgress = this.booleanValue(input.streamProgress || input.streamprogress)
    const sendProgress = () => {
      if (!streamProgress || response.response.destroyed || response.response.writableEnded) return
      response.response.write(`${JSON.stringify({ type: 'progress', total: result.selected,
        completed: result.processed + result.errors.length, processed: result.processed, failed: result.errors.length })}\n`)
    }
    if (streamProgress) {
      response.header('Content-Type', 'application/x-ndjson; charset=utf-8')
        .header('Cache-Control', 'no-store').header('X-Accel-Buffering', 'no').flushHeaders(200)
      sendProgress()
    }

    for (const indeximage of indeximages) {
      if (isCancelled()) {
        result.cancelled = true
        break
      }

      try {
        let driveFile = indeximage.drive_file_id
          ? { id: indeximage.drive_file_id, name: indeximage.file_name }
          : driveFilesByName.get(this.normalizeDriveFileName(indeximage.file_name))

        if (!driveFile?.id) {
          const foundFiles = await sendSearchFile(indeximage.file_name, typebook.company.cloud, folder[0].id)

          if (Array.isArray(foundFiles)) {
            driveFile = foundFiles.find((file) => {
              return this.normalizeDriveFileName(file?.name) === this.normalizeDriveFileName(indeximage.file_name)
            }) || foundFiles[0]
          }
        }

        if (!driveFile?.id) {
          result.skipped++
          result.errors.push({ file_name: indeximage.file_name, message: 'Arquivo não encontrado no Google Drive' })
          continue
        }

        const imageBuffer = await sendDownloadFileBuffer(driveFile.id, typebook.company.cloud)

        if (isCancelled()) {
          result.cancelled = true
          break
        }

        const side = visualModel
          ? { detectedSide: predictBookSideVisual(visualModel, (await extractBookSideVisualFeatures(imageBuffer, visualModel.extractor_sha256)).features).side, confidence: null, evidence: visualModel.model_id ? `Livro ${visualModel.book} · versão ${visualModel.model_id}` : visualModel.version }
          : await detectImageSide(imageBuffer, indeximage.file_name)
        const sidePayload = {
          detected_side: side.detectedSide,
          side_confidence: side.confidence,
          side_evidence: side.evidence,
          side_processed_at: DateTime.local(),
        }

        if (sideOnly) {
          let check = await IndeximageOcrCheck.query()
            .where('companies_id', indeximage.companies_id)
            .andWhere('typebooks_id', indeximage.typebooks_id)
            .andWhere('bookrecords_id', indeximage.bookrecords_id)
            .andWhere('seq', indeximage.seq)
            .andWhere('layout_profile', layoutProfile)
            .first()

          if (check) {
            check.merge(sidePayload)
            await check.save()
          } else {
            check = await IndeximageOcrCheck.create({
              companies_id: indeximage.companies_id,
              typebooks_id: indeximage.typebooks_id,
              bookrecords_id: indeximage.bookrecords_id,
              seq: indeximage.seq,
              layout_profile: layoutProfile,
              expected_sheet: indeximage.record_sheet ?? null,
              expected_term: indeximage.record_approximate_term ?? null,
              sheet_status: 'not_found',
              term_status: 'not_found',
              review_status: 'pending',
              auto_applied: false,
              ...sidePayload,
            })
          }
          result.processed++
          result.checks.push(check)
          continue
        }

        const extracted = layoutProfile === 'top_isolated_number'
          ? await extractTopIsolatedNumberConference(imageBuffer, indeximage.file_name, extractionOptions)
          : await extractHeaderKeywordConference(imageBuffer, indeximage.file_name, extractionOptions)

        if (isCancelled()) {
          result.cancelled = true
          break
        }

        const expectedSheet = indeximage.record_sheet ?? null
        const expectedTerm = indeximage.record_approximate_term ?? null
        const checkPayload = {
          companies_id: indeximage.companies_id,
          typebooks_id: indeximage.typebooks_id,
          bookrecords_id: indeximage.bookrecords_id,
          seq: indeximage.seq,
          layout_profile: layoutProfile,
          expected_sheet: expectedSheet,
          detected_sheet: extracted.detectedSheet,
          expected_term: expectedTerm,
          detected_term: extracted.detectedTerm,
          sheet_status: compareNumberStatus(expectedSheet, extracted.detectedSheet),
          term_status: compareTermStatus(expectedTerm, extracted.detectedTerm),
          confidence: extracted.confidence,
          confidence_level: extracted.confidenceLevel,
          evidence_text: extracted.evidenceText,
          source: extracted.source,
          processed_at: DateTime.local(),
          ...sidePayload,
        }
        const check = await IndeximageOcrCheck.updateOrCreate(
          {
            companies_id: indeximage.companies_id,
            typebooks_id: indeximage.typebooks_id,
            bookrecords_id: indeximage.bookrecords_id,
            seq: indeximage.seq,
            layout_profile: layoutProfile,
          },
          checkPayload
        )

        await IndeximageOcrEntity
          .query()
          .where('companies_id', indeximage.companies_id)
          .andWhere('typebooks_id', indeximage.typebooks_id)
          .andWhere('bookrecords_id', indeximage.bookrecords_id)
          .andWhere('seq', indeximage.seq)
          .whereIn('entity_type', ['sheet', 'term'])
          .delete()

        const existingSearchEntities = await IndeximageOcrEntity
          .query()
          .where('companies_id', indeximage.companies_id)
          .andWhere('typebooks_id', indeximage.typebooks_id)
          .andWhere('bookrecords_id', indeximage.bookrecords_id)
          .andWhere('seq', indeximage.seq)
          .whereIn('entity_type', ['name', 'document'])
        const existingByKey = new Map(
          existingSearchEntities.map((entity) => [`${entity.entity_type}:${entity.normalized_value}`, entity])
        )

        for (const entity of extracted.entities) {
          const identity = {
            companies_id: indeximage.companies_id,
            typebooks_id: indeximage.typebooks_id,
            bookrecords_id: indeximage.bookrecords_id,
            seq: indeximage.seq,
            entity_type: entity.entity_type,
            normalized_value: entity.normalized_value,
          }
          const existing = existingByKey.get(`${entity.entity_type}:${entity.normalized_value}`)

          if (existing && Number(existing.confidence || 0) >= entity.confidence) continue

          if (existing) {
            existing.merge({
              value: entity.value,
              normalized_hash: hashOcrSearchValue(entity.normalized_value),
              confidence: entity.confidence,
              source: extracted.source,
              evidence_text: entity.evidence_text,
            })
            await existing.save()
          } else {
            const created = await IndeximageOcrEntity.create({
              ...identity,
              value: entity.value,
              normalized_hash: hashOcrSearchValue(entity.normalized_value),
              confidence: entity.confidence,
              source: extracted.source,
              evidence_text: entity.evidence_text,
            })
            existingByKey.set(`${entity.entity_type}:${entity.normalized_value}`, created)
          }
        }

        result.processed++
        result.checks.push(check)
      } catch (error) {
        result.errors.push({
          file_name: indeximage.file_name,
          message: error?.message || 'Erro ao processar OCR da imagem',
        })
      } finally {
        sendProgress()
      }
    }

    if (cancelKey) OcrConferencesController.cancelledProcesses.delete(cancelKey)

    if (streamProgress) {
      if (!response.response.destroyed && !response.response.writableEnded) {
        response.response.end(`${JSON.stringify({ type: 'result', data: result })}\n`)
      }
      return
    }
    return response.status(200).send(result)
  }

  public async cancelProcess({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []
    this.ensureOcrConferenceAccess(authenticate, permissions)
    const typebooksId = Number(params.typebooks_id)
    const processId = String(request.input('processId') || request.input('processid') || '').trim()

    if (!Number.isInteger(typebooksId) || typebooksId <= 0) {
      return response.status(400).send({ message: 'typebooks_id inválido' })
    }

    if (!processId) {
      return response.status(400).send({ message: 'processId inválido' })
    }

    OcrConferencesController.cancelledProcesses.add(
      this.processKey(authenticate.companies_id, typebooksId, processId)
    )

    return response.status(200).send({ cancelled: true, process_id: processId })
  }

  public async apply({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []
    this.ensureOcrConferenceAccess(authenticate, permissions)
    const checkId = Number(params.id)
    const { applySheet, applyTerm } = request.only(['applySheet', 'applyTerm'])

    if (!Number.isInteger(checkId) || checkId <= 0) {
      return response.status(400).send({ message: 'id inválido' })
    }

    const check = await IndeximageOcrCheck
      .query()
      .where('id', checkId)
      .andWhere('companies_id', authenticate.companies_id)
      .first()

    if (!check) return response.status(404).send({ message: 'Conferência não encontrada' })

    const payload: any = {}

    if (applySheet && check.detected_sheet !== null && check.detected_sheet !== undefined) {
      payload.sheet = check.detected_sheet
    }

    if (applyTerm && check.detected_term) {
      payload.approximate_term = check.detected_term
    }

    if (!Object.keys(payload).length) {
      return response.status(422).send({ message: 'Nenhum campo detectado para aplicar' })
    }

    await Bookrecord
      .query()
      .where('id', check.bookrecords_id)
      .andWhere('companies_id', check.companies_id)
      .andWhere('typebooks_id', check.typebooks_id)
      .update(payload)

    if (payload.sheet !== undefined) {
      check.expected_sheet = payload.sheet
      check.sheet_status = 'match'
    }

    if (payload.approximate_term !== undefined) {
      check.expected_term = payload.approximate_term
      check.term_status = 'match'
    }

    check.auto_applied = false
    check.review_status = 'corrected_manually'
    check.confidence_level = this.confidenceLevel(check.confidence)
    await check.save()

    return response.status(200).send({ check, applied: payload })
  }

  public async bulkApplySides(ctx: HttpContextContract) {
    return this.bulkApplySheets(ctx, 'side')
  }

  public async bulkApplySheets({ auth, params, request, response }: HttpContextContract, field: 'sheet' | 'side' = 'sheet') {
    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []
    this.ensureOcrConferenceAccess(authenticate, permissions)
    const typebooksId = Number(params.typebooks_id)
    const input = { ...request.qs(), ...request.body() }
    const layoutProfile = this.layoutProfile(input.layoutProfile || input.layoutprofile)
    const visualModel = field === 'side' && (input.sideModel || input.sidemodel) === 'visual'
      ? await this.assistedSideModel(authenticate.companies_id, typebooksId, input) : null
    const detectedProfile = visualModel?.version || layoutProfile
    const ocrChecks = visualModel ? 'ocr_checks' : 'checks'
    const markerScope = String(input.markerScope || input.markerscope || '').trim()
    const search = normalizeOcrSearchValue(String(input.ocrSearch || input.ocrsearch || ''))
    const searchDigits = String(input.ocrSearch || input.ocrsearch || '').replace(/\D/g, '')
    const searchHash = hashOcrSearchValue(searchDigits || search)

    if (!Number.isInteger(typebooksId) || typebooksId <= 0) {
      return response.status(400).send({ message: 'typebooks_id inválido' })
    }

    if (!['marked', 'unmarked'].includes(markerScope)) {
      return response.status(400).send({ message: 'Selecione marcados ou não marcados' })
    }

    const filterValues = {
      codstart: this.bodyValue(input, 'codStart', 'codstart'),
      codend: this.bodyValue(input, 'codEnd', 'codend'),
      bookstart: this.bodyValue(input, 'bookStart', 'bookstart'),
      bookend: this.bodyValue(input, 'bookEnd', 'bookend'),
      sheetstart: this.bodyValue(input, 'sheetStart', 'sheetstart'),
      sheetend: this.bodyValue(input, 'sheetEnd', 'sheetend'),
      indexbook: input.indexbook,
      indexbookend: this.bodyValue(input, 'indexbookEnd', 'indexbookend'),
      approximateterm: this.bodyValue(input, 'approximateTerm', 'approximateterm'),
      year: input.year,
      letter: input.letter,
      side: input.side,
      obs: input.obs,
    }

    const query = Database
      .from('indeximage_ocr_checks as checks')
      .join('indeximages as indeximages', (join) => {
        join
          .on('indeximages.bookrecords_id', 'checks.bookrecords_id')
          .andOn('indeximages.typebooks_id', 'checks.typebooks_id')
          .andOn('indeximages.companies_id', 'checks.companies_id')
          .andOn('indeximages.seq', 'checks.seq')
      })
      .join('bookrecords as bookrecords', (join) => {
        join
          .on('bookrecords.id', 'indeximages.bookrecords_id')
          .andOn('bookrecords.typebooks_id', 'indeximages.typebooks_id')
          .andOn('bookrecords.companies_id', 'indeximages.companies_id')
      })
      .where('checks.companies_id', authenticate.companies_id)
      .andWhere('checks.typebooks_id', typebooksId)
      .andWhere('checks.layout_profile', detectedProfile)
      .select(
        'checks.id',
        'checks.bookrecords_id',
        field === 'side' ? 'checks.detected_side' : 'checks.detected_sheet'
      )

    if (visualModel) query.leftJoin('indeximage_ocr_checks as ocr_checks', (join) => {
      join.on('ocr_checks.bookrecords_id', 'checks.bookrecords_id')
        .andOn('ocr_checks.typebooks_id', 'checks.typebooks_id')
        .andOn('ocr_checks.companies_id', 'checks.companies_id')
        .andOn('ocr_checks.seq', 'checks.seq')
        .andOnVal('ocr_checks.layout_profile', layoutProfile)
    })
    if (field === 'side') query.whereNotNull('checks.side_processed_at').whereIn('checks.detected_side', ['F', 'V'])
    else query.whereNotNull('checks.detected_sheet')

    this.applyBookrecordFilters(query, filterValues, 'bookrecords')

    if (markerScope === 'marked') query.andWhere(`${ocrChecks}.line_marker`, true)
    else if (visualModel) query.where((unmarked) => unmarked.where(`${ocrChecks}.line_marker`, false).orWhereNull(`${ocrChecks}.line_marker`))
    else query.andWhere('checks.line_marker', false)

    const sheetStatus = input.sheetStatus || input.sheetstatus
    const termStatus = input.termStatus || input.termstatus
    const confidenceLevel = input.confidenceLevel || input.confidencelevel
    const reviewStatus = input.reviewStatus || input.reviewstatus

    if (sheetStatus === 'not_processed') query.whereNull(`${ocrChecks}.processed_at`)
    else if (sheetStatus) query.andWhere(`${ocrChecks}.sheet_status`, sheetStatus)

    if (termStatus === 'not_processed') query.whereNull(`${ocrChecks}.processed_at`)
    else if (termStatus) query.andWhere(`${ocrChecks}.term_status`, termStatus)

    if (confidenceLevel) query.andWhere(`${ocrChecks}.confidence_level`, confidenceLevel)
    if (reviewStatus === 'not_processed') query.whereNull(`${ocrChecks}.processed_at`)
    else if (reviewStatus) query.andWhere(`${ocrChecks}.review_status`, reviewStatus)
    if (field === 'side') {
      const sideStatus = input.sideStatus || input.sidestatus
      if (sideStatus === 'match') query.whereRaw('bookrecords.side = checks.detected_side')
      else if (sideStatus === 'divergent') query.whereRaw('bookrecords.side <> checks.detected_side')
      else if (sideStatus === 'detected') query.whereNull('bookrecords.side')
      else if (sideStatus === 'not_found' || sideStatus === 'not_processed') query.whereRaw('1 = 0')
    }
    if (this.booleanValue(input.lineMarker || input.linemarker)) query.andWhere(`${ocrChecks}.line_marker`, true)

    if (search) {
      query.whereExists((entityQuery) => {
        entityQuery
          .from('indeximage_ocr_entities as entities')
          .whereRaw('entities.companies_id = checks.companies_id')
          .whereRaw('entities.typebooks_id = checks.typebooks_id')
          .whereRaw('entities.bookrecords_id = checks.bookrecords_id')
          .whereRaw('entities.seq = checks.seq')
          .andWhere((valueQuery) => {
            valueQuery.where('entities.normalized_value', 'like', `%${search}%`)

            if (searchDigits) {
              valueQuery.orWhere('entities.normalized_value', 'like', `%${searchDigits}%`)
            }

            if (searchHash) {
              valueQuery.orWhere('entities.normalized_hash', searchHash)
            }
          })
      })
    }

    const rows = await query
    const grouped = new Map<number, { detectedValues: Set<number | string>, checkIds: number[] }>()

    for (const row of rows) {
      const bookrecordId = Number(row.bookrecords_id)
      const detectedValue = field === 'side' ? row.detected_side : Number(row.detected_sheet)

      if (!Number.isInteger(bookrecordId) || (field === 'sheet' && !Number.isInteger(detectedValue))) continue

      const group = grouped.get(bookrecordId) || { detectedValues: new Set<number | string>(), checkIds: [] }
      group.detectedValues.add(detectedValue)
      group.checkIds.push(Number(row.id))
      grouped.set(bookrecordId, group)
    }

    const conflictingRecords = new Set<number>()
    if (field === 'side' && grouped.size) {
      const conflicts = await Database.from('indeximage_ocr_checks as other')
        .join('indeximages as images', (join) => join.on('images.bookrecords_id', 'other.bookrecords_id')
          .andOn('images.companies_id', 'other.companies_id')
          .andOn('images.typebooks_id', 'other.typebooks_id').andOn('images.seq', 'other.seq'))
        .where('other.companies_id', authenticate.companies_id)
        .andWhere('other.typebooks_id', typebooksId)
        .andWhere('other.layout_profile', detectedProfile)
        .whereIn('other.bookrecords_id', Array.from(grouped.keys()))
        .whereNotNull('other.side_processed_at')
        .whereIn('other.detected_side', ['F', 'V'])
        .groupBy('other.bookrecords_id')
        .havingRaw('COUNT(DISTINCT other.detected_side) > 1')
        .select('other.bookrecords_id')
      for (const row of conflicts) conflictingRecords.add(Number(row.bookrecords_id))
    }

    const targets = Array.from(grouped.entries())
      .filter(([bookrecordId, group]) => group.detectedValues.size === 1 && !conflictingRecords.has(bookrecordId))
      .map(([bookrecordId, group]) => ({
        bookrecordId,
        detectedValue: Array.from(group.detectedValues)[0],
        checkIds: group.checkIds.filter(Boolean),
      }))
    const conflicts = grouped.size - targets.length
    const now = DateTime.local().toSQL({ includeOffset: false })

    await Database.transaction(async (trx) => {
      for (const target of targets) {
        if (field === 'side') {
          await Database.from('bookrecords').useTransaction(trx)
            .where('id', target.bookrecordId)
            .andWhere('companies_id', authenticate.companies_id)
            .andWhere('typebooks_id', typebooksId)
            .update({ side: target.detectedValue, updated_at: now })
          continue
        }
        await Database
          .from('bookrecords')
          .useTransaction(trx)
          .where('id', target.bookrecordId)
          .andWhere('companies_id', authenticate.companies_id)
          .andWhere('typebooks_id', typebooksId)
          .update({
            sheet: target.detectedValue,
            updated_at: now,
          })

        await Database.rawQuery(
          `
            UPDATE indeximage_ocr_checks
            SET expected_sheet = ?,
                sheet_status = CASE
                  WHEN detected_sheet IS NULL THEN 'not_found'
                  WHEN detected_sheet = ? THEN 'match'
                  ELSE 'divergent'
                END,
                review_status = CASE
                  WHEN id IN (${target.checkIds.map(() => '?').join(', ')}) THEN 'corrected_manually'
                  ELSE review_status
                END,
                updated_at = ?
            WHERE companies_id = ?
              AND typebooks_id = ?
              AND bookrecords_id = ?
              AND layout_profile = ?
          `,
          [
            target.detectedValue,
            target.detectedValue,
            ...target.checkIds,
            now,
            authenticate.companies_id,
            typebooksId,
            target.bookrecordId,
            layoutProfile,
          ]
        ).useTransaction(trx)
      }
    })

    return response.status(200).send({
      selected: rows.length,
      updated: targets.length,
      conflicts,
      marker_scope: markerScope,
    })
  }

  public async updateSheet({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []
    this.ensureOcrConferenceAccess(authenticate, permissions)
    const typebooksId = Number(params.typebooks_id)
    const bookrecordId = Number(params.bookrecord_id)
    const sequence = Number(request.input('seq'))
    const layoutProfile = this.layoutProfile(request.input('layoutProfile') || request.input('layoutprofile'))
    const rawSheet = request.input('sheet')
    const sheet = rawSheet === undefined || rawSheet === null || String(rawSheet).trim() === ''
      ? null
      : Number(rawSheet)

    if (!Number.isInteger(typebooksId) || typebooksId <= 0) {
      return response.status(400).send({ message: 'typebooks_id inválido' })
    }

    if (!Number.isInteger(bookrecordId) || bookrecordId <= 0) {
      return response.status(400).send({ message: 'bookrecord_id inválido' })
    }

    if (sheet !== null && (!Number.isInteger(sheet) || sheet < 0)) {
      return response.status(400).send({ message: 'Folha inválida' })
    }

    const bookrecord = await Bookrecord
      .query()
      .where('id', bookrecordId)
      .andWhere('companies_id', authenticate.companies_id)
      .andWhere('typebooks_id', typebooksId)
      .first()

    if (!bookrecord) return response.status(404).send({ message: 'Registro não encontrado' })

    bookrecord.sheet = sheet as any
    await bookrecord.save()

    let check: IndeximageOcrCheck | null = null

    if (Number.isInteger(sequence) && sequence >= 0) {
      check = await IndeximageOcrCheck
        .query()
        .where('companies_id', authenticate.companies_id)
        .andWhere('typebooks_id', typebooksId)
        .andWhere('bookrecords_id', bookrecordId)
        .andWhere('seq', sequence)
        .andWhere('layout_profile', layoutProfile)
        .first()

      if (check) {
        check.expected_sheet = sheet
        check.sheet_status = compareNumberStatus(sheet, check.detected_sheet)
        check.review_status = 'corrected_manually'
        await check.save()
      }
    }

    return response.status(200).send({
      bookrecord: {
        id: bookrecord.id,
        sheet: bookrecord.sheet,
      },
      check,
    })
  }

  public async updateSide({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []
    this.ensureOcrConferenceAccess(authenticate, permissions)
    const typebooksId = Number(params.typebooks_id)
    const bookrecordId = Number(params.bookrecord_id)
    const rawSide = request.input('side')
    const side = rawSide === undefined || rawSide === null || String(rawSide).trim() === ''
      ? null
      : String(rawSide).trim().toUpperCase()

    if (!Number.isInteger(typebooksId) || typebooksId <= 0) {
      return response.status(400).send({ message: 'typebooks_id inválido' })
    }

    if (!Number.isInteger(bookrecordId) || bookrecordId <= 0) {
      return response.status(400).send({ message: 'bookrecord_id inválido' })
    }

    if (side !== null && !['F', 'V'].includes(side)) {
      return response.status(400).send({ message: 'Lado inválido' })
    }

    const bookrecord = await Bookrecord
      .query()
      .where('id', bookrecordId)
      .andWhere('companies_id', authenticate.companies_id)
      .andWhere('typebooks_id', typebooksId)
      .first()

    if (!bookrecord) return response.status(404).send({ message: 'Registro não encontrado' })

    bookrecord.side = side as any
    await bookrecord.save()

    return response.status(200).send({
      bookrecord: {
        id: bookrecord.id,
        side: bookrecord.side,
      },
    })
  }

  public async updateMarker({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []
    this.ensureOcrConferenceAccess(authenticate, permissions)
    const checkId = Number(params.id)
    const markerInput = request.input('lineMarker') !== undefined
      ? request.input('lineMarker')
      : request.input('line_marker')
    const lineMarker = this.booleanValue(markerInput)

    if (!Number.isInteger(checkId) || checkId <= 0) {
      return response.status(400).send({ message: 'id inválido' })
    }

    const check = await IndeximageOcrCheck
      .query()
      .where('id', checkId)
      .andWhere('companies_id', authenticate.companies_id)
      .first()

    if (!check) return response.status(404).send({ message: 'Conferência não encontrada' })

    check.line_marker = lineMarker
    await check.save()

    return response.status(200).send({ check })
  }

  public async updateRowMarker({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []
    this.ensureOcrConferenceAccess(authenticate, permissions)
    const typebooksId = Number(params.typebooks_id)
    const bookrecordId = Number(params.bookrecord_id)
    const sequence = Number(request.input('seq'))
    const layoutProfile = this.layoutProfile(request.input('layoutProfile') || request.input('layoutprofile'))
    const markerInput = request.input('lineMarker') !== undefined
      ? request.input('lineMarker')
      : request.input('line_marker')
    const lineMarker = this.booleanValue(markerInput)

    if (!Number.isInteger(typebooksId) || typebooksId <= 0) {
      return response.status(400).send({ message: 'typebooks_id inválido' })
    }

    if (!Number.isInteger(bookrecordId) || bookrecordId <= 0) {
      return response.status(400).send({ message: 'bookrecord_id inválido' })
    }

    if (!Number.isInteger(sequence) || sequence < 0) {
      return response.status(400).send({ message: 'seq inválido' })
    }

    const row = await Database
      .from('indeximages as indeximages')
      .join('bookrecords as bookrecords', (join) => {
        join
          .on('bookrecords.id', 'indeximages.bookrecords_id')
          .andOn('bookrecords.typebooks_id', 'indeximages.typebooks_id')
          .andOn('bookrecords.companies_id', 'indeximages.companies_id')
      })
      .where('indeximages.companies_id', authenticate.companies_id)
      .andWhere('indeximages.typebooks_id', typebooksId)
      .andWhere('indeximages.bookrecords_id', bookrecordId)
      .andWhere('indeximages.seq', sequence)
      .select(
        'bookrecords.sheet',
        'bookrecords.approximate_term'
      )
      .first()

    if (!row) return response.status(404).send({ message: 'Imagem não encontrada' })

    let check = await IndeximageOcrCheck
      .query()
      .where('companies_id', authenticate.companies_id)
      .andWhere('typebooks_id', typebooksId)
      .andWhere('bookrecords_id', bookrecordId)
      .andWhere('seq', sequence)
      .andWhere('layout_profile', layoutProfile)
      .first()

    if (check) {
      check.line_marker = lineMarker
      await check.save()

      return response.status(200).send({ check })
    }

    check = await IndeximageOcrCheck.create({
      companies_id: authenticate.companies_id,
      typebooks_id: typebooksId,
      bookrecords_id: bookrecordId,
      seq: sequence,
      layout_profile: layoutProfile,
      expected_sheet: row.sheet ?? null,
      expected_term: row.approximate_term ?? null,
      sheet_status: 'not_found',
      term_status: 'not_found',
      auto_applied: false,
      review_status: 'pending',
      line_marker: lineMarker,
      processed_at: null,
    })

    return response.status(200).send({ check })
  }
}
