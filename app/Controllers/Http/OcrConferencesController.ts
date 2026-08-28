import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Typebook from 'App/Models/Typebook'
import Bookrecord from 'App/Models/Bookrecord'
import IndeximageOcrCheck from 'App/Models/IndeximageOcrCheck'
import IndeximageOcrEntity from 'App/Models/IndeximageOcrEntity'
import { verifyPermission } from 'App/Services/util'
import {
  sendDownloadFileBuffer,
  sendListAllFilesMetadata,
  sendSearchFile,
} from 'App/Services/googleDrive/googledrive'
import {
  compareNumberStatus,
  compareTermStatus,
  extractHeaderKeywordConference,
  extractTopIsolatedNumberConference,
  hashOcrSearchValue,
  normalizeOcrSearchValue,
} from 'App/Services/ocr/indexImageOcrConference'

export default class OcrConferencesController {
  private static cancelledProcesses = new Set<string>()

  private ocrConferencePermissiongroupId = 44

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
    const layoutProfile = this.layoutProfile(qs.layoutprofile || qs.layoutProfile)
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

    this.applyBookrecordFilters(query, qs, 'bookrecords')

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
      obs: input.obs,
      lineMarker: input.lineMarker !== undefined ? input.lineMarker : input.linemarker,
    }
    const layoutProfile = this.layoutProfile(body.layoutProfile)
    const extractionOptions = {
      extractionRegion: this.extractionRegion(body.extractionRegion),
      positiveKeywords: this.keywordList(body.positiveKeywords),
      negativeKeywords: this.keywordList(body.negativeKeywords),
    }
    const limit = Math.min(Math.max(Number(body.limit || 20), 1), 100)
    const force = this.booleanValue(body.force)
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
          .whereNotNull('checks.processed_at')
      })
    }
    const reconciledSheetMatches = await this.reconcileProcessedSheetMatches(buildSelectionQuery, layoutProfile)
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
        version: 'ocr-process-2026-08-18-06',
        layout_profile: layoutProfile,
        force,
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

    for (const indeximage of indeximages) {
      if (isCancelled()) {
        result.cancelled = true
        break
      }

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

      try {
        const imageBuffer = await sendDownloadFileBuffer(driveFile.id, typebook.company.cloud)

        if (isCancelled()) {
          result.cancelled = true
          break
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
          .delete()

        if (extracted.entities.length) {
          await IndeximageOcrEntity.createMany(
            extracted.entities.map((entity) => ({
              companies_id: indeximage.companies_id,
              typebooks_id: indeximage.typebooks_id,
              bookrecords_id: indeximage.bookrecords_id,
              seq: indeximage.seq,
              entity_type: entity.entity_type,
              value: entity.value,
              normalized_value: entity.normalized_value,
              normalized_hash: hashOcrSearchValue(entity.normalized_value),
              confidence: entity.confidence,
              source: extracted.source,
              evidence_text: entity.evidence_text,
            }))
          )
        }

        result.processed++
        result.checks.push(check)
      } catch (error) {
        result.errors.push({
          file_name: indeximage.file_name,
          message: error?.message || 'Erro ao processar OCR da imagem',
        })
      }
    }

    if (cancelKey) OcrConferencesController.cancelledProcesses.delete(cancelKey)

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

  public async bulkApplySheets({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []
    this.ensureOcrConferenceAccess(authenticate, permissions)
    const typebooksId = Number(params.typebooks_id)
    const input = { ...request.qs(), ...request.body() }
    const layoutProfile = this.layoutProfile(input.layoutProfile || input.layoutprofile)
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
      .andWhere('checks.layout_profile', layoutProfile)
      .whereNotNull('checks.detected_sheet')
      .select(
        'checks.id',
        'checks.bookrecords_id',
        'checks.detected_sheet'
      )

    this.applyBookrecordFilters(query, filterValues, 'bookrecords')

    if (markerScope === 'marked') query.andWhere('checks.line_marker', true)
    else query.andWhere('checks.line_marker', false)

    const sheetStatus = input.sheetStatus || input.sheetstatus
    const termStatus = input.termStatus || input.termstatus
    const confidenceLevel = input.confidenceLevel || input.confidencelevel
    const reviewStatus = input.reviewStatus || input.reviewstatus

    if (sheetStatus === 'not_processed') query.whereNull('checks.processed_at')
    else if (sheetStatus) query.andWhere('checks.sheet_status', sheetStatus)

    if (termStatus === 'not_processed') query.whereNull('checks.processed_at')
    else if (termStatus) query.andWhere('checks.term_status', termStatus)

    if (confidenceLevel) query.andWhere('checks.confidence_level', confidenceLevel)
    if (reviewStatus === 'not_processed') query.whereNull('checks.processed_at')
    else if (reviewStatus) query.andWhere('checks.review_status', reviewStatus)

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
    const grouped = new Map<number, { detectedSheets: Set<number>, checkIds: number[] }>()

    for (const row of rows) {
      const bookrecordId = Number(row.bookrecords_id)
      const detectedSheet = Number(row.detected_sheet)

      if (!Number.isInteger(bookrecordId) || !Number.isInteger(detectedSheet)) continue

      const group = grouped.get(bookrecordId) || { detectedSheets: new Set<number>(), checkIds: [] }
      group.detectedSheets.add(detectedSheet)
      group.checkIds.push(Number(row.id))
      grouped.set(bookrecordId, group)
    }

    const targets = Array.from(grouped.entries())
      .filter(([, group]) => group.detectedSheets.size === 1)
      .map(([bookrecordId, group]) => ({
        bookrecordId,
        detectedSheet: Array.from(group.detectedSheets)[0],
        checkIds: group.checkIds.filter(Boolean),
      }))
    const conflicts = grouped.size - targets.length
    const now = DateTime.local().toSQL()

    await Database.transaction(async (trx) => {
      for (const target of targets) {
        await Database
          .from('bookrecords')
          .useTransaction(trx)
          .where('id', target.bookrecordId)
          .andWhere('companies_id', authenticate.companies_id)
          .andWhere('typebooks_id', typebooksId)
          .update({
            sheet: target.detectedSheet,
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
            target.detectedSheet,
            target.detectedSheet,
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
