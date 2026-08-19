"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const luxon_1 = require("luxon");
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
const Bookrecord_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Bookrecord"));
const IndeximageOcrCheck_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/IndeximageOcrCheck"));
const IndeximageOcrEntity_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/IndeximageOcrEntity"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
const indexImageOcrConference_1 = global[Symbol.for('ioc.use')]("App/Services/ocr/indexImageOcrConference");
class OcrConferencesController {
    constructor() {
        this.ocrConferencePermissiongroupId = 44;
    }
    ensureOcrConferenceAccess(authenticate, permissions = []) {
        if (!(0, util_1.verifyPermission)(Boolean(authenticate.superuser), permissions, this.ocrConferencePermissiongroupId)) {
            throw new BadRequestException_1.default('Acesso a conferência OCR não permitido', 403, 'ocr_conference_permission_required');
        }
    }
    normalizeDriveFileName(value) {
        return String(value || '')
            .normalize('NFC')
            .trim()
            .toLowerCase();
    }
    numberOrNull(value) {
        if (value === undefined || value === null)
            return null;
        if (typeof value === 'string' && value.trim() === '')
            return null;
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }
    booleanValue(value) {
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'string')
            return value === 'true' || value === '1';
        return Boolean(value);
    }
    extractionRegion(value) {
        const region = String(value || 'auto_header').trim();
        const allowedRegions = [
            'auto_header',
            'upper_half',
            'full_page',
            'top_external',
            'top_right',
            'top_left',
            'top_full',
        ];
        return allowedRegions.includes(region) ? region : 'auto_header';
    }
    layoutProfile(value) {
        const layoutProfile = String(value || 'header_keyword').trim();
        const allowedProfiles = ['header_keyword', 'top_isolated_number'];
        return allowedProfiles.includes(layoutProfile) ? layoutProfile : 'header_keyword';
    }
    keywordList(value) {
        if (Array.isArray(value)) {
            return value.map((item) => String(item || '').trim()).filter(Boolean);
        }
        return String(value || '')
            .split(/\r?\n|,/)
            .map((item) => item.trim())
            .filter(Boolean);
    }
    hasValue(value) {
        return value !== undefined && value !== null && String(value).trim() !== '';
    }
    applyExactOrRangeFilter(query, column, startValue, endValue) {
        const start = this.numberOrNull(startValue);
        const end = this.numberOrNull(endValue);
        if (start !== null && end === null)
            query.where(column, start);
        else if (start !== null && end !== null)
            query.where(column, '>=', start);
        if (end !== null)
            query.where(column, '<=', end);
    }
    applyBookrecordFilters(query, filters, tableAlias = '') {
        const column = (field) => tableAlias ? `${tableAlias}.${field}` : field;
        this.applyExactOrRangeFilter(query, column('cod'), filters.codstart, filters.codend);
        this.applyExactOrRangeFilter(query, column('book'), filters.bookstart, filters.bookend);
        const sheetStart = this.numberOrNull(filters.sheetstart);
        const sheetEnd = this.numberOrNull(filters.sheetend);
        if (sheetStart === 0) {
            query.where((sheetQuery) => {
                sheetQuery.whereNull(column('sheet'));
                if (sheetEnd !== null) {
                    sheetQuery.orWhere((rangeQuery) => {
                        rangeQuery.where(column('sheet'), '>=', sheetStart).andWhere(column('sheet'), '<=', sheetEnd);
                    });
                }
                else {
                    sheetQuery.orWhere(column('sheet'), sheetStart);
                }
            });
        }
        else {
            this.applyExactOrRangeFilter(query, column('sheet'), filters.sheetstart, filters.sheetend);
        }
        const indexbookStart = this.numberOrNull(filters.indexbook);
        const indexbookEnd = this.numberOrNull(filters.indexbookend);
        if (indexbookStart === 0) {
            query.whereNull(column('indexbook'));
        }
        else if (indexbookStart !== null && indexbookEnd === null) {
            query.where(column('indexbook'), indexbookStart);
        }
        else if (indexbookStart !== null && indexbookEnd !== null) {
            query.whereBetween(column('indexbook'), [indexbookStart, indexbookEnd]);
        }
        const approximateTerm = this.numberOrNull(filters.approximateterm);
        if (approximateTerm !== null) {
            query.whereRaw(`CONCAT('-', ${column('approximate_term')}, '-') LIKE ?`, [`%-${approximateTerm}-%`]);
        }
        if (this.hasValue(filters.year))
            query.where(column('year'), filters.year);
        if (this.hasValue(filters.letter))
            query.where(column('letter'), filters.letter);
        if (filters.side && filters.side !== 'any')
            query.where(column('side'), filters.side);
        if (this.hasValue(filters.obs))
            query.where(column('obs'), filters.obs);
    }
    confidenceLevel(confidence) {
        const value = Number(confidence || 0);
        if (value >= 0.92)
            return 'high';
        if (value >= 0.7)
            return 'medium';
        return 'low';
    }
    countValue(row) {
        return Number(row?.total || row?.['count(*)'] || 0);
    }
    bodyValue(body, camelKey, lowerKey) {
        return body[camelKey] !== undefined && body[camelKey] !== null && body[camelKey] !== ''
            ? body[camelKey]
            : body[lowerKey];
    }
    async getTypebook(companiesId, typebooksId) {
        return Typebook_1.default
            .query()
            .preload('company')
            .where('companies_id', companiesId)
            .andWhere('id', typebooksId)
            .first();
    }
    async index({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const permissions = auth.use('api').token?.meta.payload.permissions || [];
        this.ensureOcrConferenceAccess(authenticate, permissions);
        const typebooksId = Number(params.typebooks_id);
        const qs = request.qs();
        const page = Number(qs.page || 1);
        const layoutProfile = this.layoutProfile(qs.layoutprofile || qs.layoutProfile);
        const search = (0, indexImageOcrConference_1.normalizeOcrSearchValue)(String(qs.ocrsearch || ''));
        if (!Number.isInteger(typebooksId) || typebooksId <= 0) {
            return response.status(400).send({ message: 'typebooks_id inválido' });
        }
        const query = Database_1.default
            .from('indeximages as indeximages')
            .join('bookrecords as bookrecords', (join) => {
            join
                .on('bookrecords.id', 'indeximages.bookrecords_id')
                .andOn('bookrecords.typebooks_id', 'indeximages.typebooks_id')
                .andOn('bookrecords.companies_id', 'indeximages.companies_id');
        })
            .leftJoin('indeximage_ocr_checks as checks', (join) => {
            join
                .on('checks.bookrecords_id', 'indeximages.bookrecords_id')
                .andOn('checks.typebooks_id', 'indeximages.typebooks_id')
                .andOn('checks.companies_id', 'indeximages.companies_id')
                .andOn('checks.seq', 'indeximages.seq')
                .andOnVal('checks.layout_profile', layoutProfile);
        })
            .where('indeximages.companies_id', authenticate.companies_id)
            .andWhere('indeximages.typebooks_id', typebooksId)
            .select('checks.id', 'checks.layout_profile', 'checks.expected_sheet', 'checks.detected_sheet', 'checks.expected_term', 'checks.detected_term', 'checks.sheet_status', 'checks.term_status', 'checks.confidence', 'checks.confidence_level', 'checks.evidence_text', 'checks.source', 'checks.auto_applied', 'checks.review_status', 'checks.processed_at', 'bookrecords.id as bookrecord_id', 'bookrecords.cod', 'bookrecords.book', 'bookrecords.sheet', 'bookrecords.side', 'bookrecords.approximate_term', 'bookrecords.indexbook', 'bookrecords.year', 'bookrecords.letter', 'bookrecords.obs', 'indeximages.file_name', 'indeximages.ext')
            .orderBy('bookrecords.book', 'asc')
            .orderBy('bookrecords.sheet', 'asc')
            .orderBy('bookrecords.cod', 'asc')
            .orderBy('checks.seq', 'asc');
        this.applyBookrecordFilters(query, qs, 'bookrecords');
        if (qs.sheetstatus === 'not_processed')
            query.whereNull('checks.id');
        else if (qs.sheetstatus)
            query.andWhere('checks.sheet_status', qs.sheetstatus);
        if (qs.termstatus === 'not_processed')
            query.whereNull('checks.id');
        else if (qs.termstatus)
            query.andWhere('checks.term_status', qs.termstatus);
        if (qs.confidencelevel)
            query.andWhere('checks.confidence_level', qs.confidencelevel);
        if (qs.reviewstatus === 'not_processed')
            query.whereNull('checks.id');
        else if (qs.reviewstatus)
            query.andWhere('checks.review_status', qs.reviewstatus);
        if (search) {
            query.whereExists((entityQuery) => {
                entityQuery
                    .from('indeximage_ocr_entities as entities')
                    .whereRaw('entities.companies_id = indeximages.companies_id')
                    .whereRaw('entities.typebooks_id = indeximages.typebooks_id')
                    .whereRaw('entities.bookrecords_id = indeximages.bookrecords_id')
                    .whereRaw('entities.seq = indeximages.seq')
                    .where('entities.normalized_value', 'like', `%${search}%`);
            });
        }
        const result = await query.paginate(page, 50);
        return response.status(200).send(result);
    }
    async process({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const permissions = auth.use('api').token?.meta.payload.permissions || [];
        this.ensureOcrConferenceAccess(authenticate, permissions);
        const typebooksId = Number(params.typebooks_id);
        const input = { ...request.qs(), ...request.body() };
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
        };
        const layoutProfile = this.layoutProfile(body.layoutProfile);
        const extractionOptions = {
            extractionRegion: this.extractionRegion(body.extractionRegion),
            positiveKeywords: this.keywordList(body.positiveKeywords),
            negativeKeywords: this.keywordList(body.negativeKeywords),
        };
        const limit = Math.min(Math.max(Number(body.limit || 20), 1), 100);
        const force = this.booleanValue(body.force);
        const singleFileName = String(body.fileName || '').trim();
        const bookrecordsId = Number(body.bookrecords_id);
        const sequence = Number(body.seq);
        if (!Number.isInteger(typebooksId) || typebooksId <= 0) {
            return response.status(400).send({ message: 'typebooks_id inválido' });
        }
        const typebook = await this.getTypebook(authenticate.companies_id, typebooksId);
        if (!typebook)
            return response.status(404).send({ message: 'Typebook não encontrado' });
        if (!typebook.path)
            return response.status(422).send({ message: 'Typebook sem caminho da pasta configurado' });
        if (!typebook.company?.cloud)
            return response.status(422).send({ message: 'Empresa sem configuração de cloud' });
        const folder = await (0, googledrive_1.sendSearchFile)(typebook.path, typebook.company.cloud);
        if (!Array.isArray(folder) || !folder[0]?.id) {
            return response.status(404).send({
                message: 'Pasta do Google Drive não encontrada',
                path: typebook.path,
            });
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
        };
        const buildSelectionQuery = () => {
            const selectionQuery = Database_1.default
                .from('indeximages as indeximages')
                .join('bookrecords as bookrecords', (join) => {
                join
                    .on('bookrecords.id', 'indeximages.bookrecords_id')
                    .andOn('bookrecords.typebooks_id', 'indeximages.typebooks_id')
                    .andOn('bookrecords.companies_id', 'indeximages.companies_id');
            })
                .where('indeximages.companies_id', authenticate.companies_id)
                .andWhere('indeximages.typebooks_id', typebooksId);
            this.applyBookrecordFilters(selectionQuery, filterValues, 'bookrecords');
            if (singleFileName)
                selectionQuery.andWhere('indeximages.file_name', singleFileName);
            if (Number.isInteger(bookrecordsId) && bookrecordsId > 0)
                selectionQuery.andWhere('indeximages.bookrecords_id', bookrecordsId);
            if (Number.isInteger(sequence) && sequence >= 0)
                selectionQuery.andWhere('indeximages.seq', sequence);
            return selectionQuery;
        };
        const applyPendingFilter = (selectionQuery) => {
            return selectionQuery.whereNotExists((checkQuery) => {
                checkQuery
                    .from('indeximage_ocr_checks as checks')
                    .whereRaw('checks.companies_id = indeximages.companies_id')
                    .whereRaw('checks.typebooks_id = indeximages.typebooks_id')
                    .whereRaw('checks.bookrecords_id = indeximages.bookrecords_id')
                    .whereRaw('checks.seq = indeximages.seq')
                    .where('checks.layout_profile', layoutProfile);
            });
        };
        const matchingBeforePending = this.countValue(await buildSelectionQuery().count('* as total').first());
        const matchingAfterPending = force
            ? matchingBeforePending
            : this.countValue(await applyPendingFilter(buildSelectionQuery()).count('* as total').first());
        const query = buildSelectionQuery()
            .select('indeximages.companies_id', 'indeximages.typebooks_id', 'indeximages.bookrecords_id', 'indeximages.seq', 'indeximages.file_name', 'indeximages.drive_file_id', 'indeximages.book as index_book', 'bookrecords.book as record_book', 'bookrecords.sheet as record_sheet', 'bookrecords.approximate_term as record_approximate_term')
            .orderBy('bookrecords.book', 'asc')
            .orderBy('bookrecords.sheet', 'asc')
            .orderBy('bookrecords.cod', 'asc')
            .orderBy('indeximages.seq', 'asc')
            .limit(limit);
        if (!force) {
            applyPendingFilter(query);
        }
        const indeximages = await query;
        const driveFileIdsFound = indeximages.filter((item) => item.drive_file_id).length;
        const needsDriveNameLookup = indeximages.some((item) => !item.drive_file_id);
        const result = {
            selected: indeximages.length,
            total_filter_rows: matchingBeforePending,
            drive_files_found: driveFileIdsFound,
            processed: 0,
            skipped: 0,
            errors: [],
            checks: [],
            debug: {
                version: 'ocr-process-2026-08-18-06',
                layout_profile: layoutProfile,
                force,
                limit,
                matching_before_pending: matchingBeforePending,
                matching_after_pending: matchingAfterPending,
                drive_lookup_by_name: needsDriveNameLookup,
                extraction_options: extractionOptions,
                filters: filterValues,
            },
        };
        if (!indeximages.length) {
            return response.status(200).send(result);
        }
        const bookNumbers = Array.from(new Set(indeximages
            .map((item) => Number(item.record_book || item.index_book))
            .filter((item) => Number.isInteger(item) && item > 0)));
        const driveFiles = needsDriveNameLookup
            ? singleFileName
                ? await (0, googledrive_1.sendSearchFile)(singleFileName, typebook.company.cloud, folder[0].id)
                : await (0, googledrive_1.sendListAllFilesMetadata)(typebook.company.cloud, folder, bookNumbers)
            : [];
        const driveFilesByName = new Map();
        for (const file of driveFiles || []) {
            if (file?.name)
                driveFilesByName.set(this.normalizeDriveFileName(file.name), file);
        }
        result.drive_files_found = driveFileIdsFound + driveFilesByName.size;
        for (const indeximage of indeximages) {
            let driveFile = indeximage.drive_file_id
                ? { id: indeximage.drive_file_id, name: indeximage.file_name }
                : driveFilesByName.get(this.normalizeDriveFileName(indeximage.file_name));
            if (!driveFile?.id) {
                const foundFiles = await (0, googledrive_1.sendSearchFile)(indeximage.file_name, typebook.company.cloud, folder[0].id);
                if (Array.isArray(foundFiles)) {
                    driveFile = foundFiles.find((file) => {
                        return this.normalizeDriveFileName(file?.name) === this.normalizeDriveFileName(indeximage.file_name);
                    }) || foundFiles[0];
                }
            }
            if (!driveFile?.id) {
                result.skipped++;
                result.errors.push({ file_name: indeximage.file_name, message: 'Arquivo não encontrado no Google Drive' });
                continue;
            }
            try {
                const imageBuffer = await (0, googledrive_1.sendDownloadFileBuffer)(driveFile.id, typebook.company.cloud);
                const extracted = layoutProfile === 'top_isolated_number'
                    ? await (0, indexImageOcrConference_1.extractTopIsolatedNumberConference)(imageBuffer, indeximage.file_name, extractionOptions)
                    : await (0, indexImageOcrConference_1.extractHeaderKeywordConference)(imageBuffer, indeximage.file_name, extractionOptions);
                const expectedSheet = indeximage.record_sheet ?? null;
                const expectedTerm = indeximage.record_approximate_term ?? null;
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
                    sheet_status: (0, indexImageOcrConference_1.compareNumberStatus)(expectedSheet, extracted.detectedSheet),
                    term_status: (0, indexImageOcrConference_1.compareTermStatus)(expectedTerm, extracted.detectedTerm),
                    confidence: extracted.confidence,
                    confidence_level: extracted.confidenceLevel,
                    evidence_text: extracted.evidenceText,
                    source: extracted.source,
                    processed_at: luxon_1.DateTime.local(),
                };
                const check = await IndeximageOcrCheck_1.default.updateOrCreate({
                    companies_id: indeximage.companies_id,
                    typebooks_id: indeximage.typebooks_id,
                    bookrecords_id: indeximage.bookrecords_id,
                    seq: indeximage.seq,
                    layout_profile: layoutProfile,
                }, checkPayload);
                await IndeximageOcrEntity_1.default
                    .query()
                    .where('companies_id', indeximage.companies_id)
                    .andWhere('typebooks_id', indeximage.typebooks_id)
                    .andWhere('bookrecords_id', indeximage.bookrecords_id)
                    .andWhere('seq', indeximage.seq)
                    .delete();
                if (extracted.entities.length) {
                    await IndeximageOcrEntity_1.default.createMany(extracted.entities.map((entity) => ({
                        companies_id: indeximage.companies_id,
                        typebooks_id: indeximage.typebooks_id,
                        bookrecords_id: indeximage.bookrecords_id,
                        seq: indeximage.seq,
                        entity_type: entity.entity_type,
                        value: entity.value,
                        normalized_value: entity.normalized_value,
                        confidence: entity.confidence,
                        source: extracted.source,
                        evidence_text: entity.evidence_text,
                    })));
                }
                result.processed++;
                result.checks.push(check);
            }
            catch (error) {
                result.errors.push({
                    file_name: indeximage.file_name,
                    message: error?.message || 'Erro ao processar OCR da imagem',
                });
            }
        }
        return response.status(200).send(result);
    }
    async apply({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const permissions = auth.use('api').token?.meta.payload.permissions || [];
        this.ensureOcrConferenceAccess(authenticate, permissions);
        const checkId = Number(params.id);
        const { applySheet, applyTerm } = request.only(['applySheet', 'applyTerm']);
        if (!Number.isInteger(checkId) || checkId <= 0) {
            return response.status(400).send({ message: 'id inválido' });
        }
        const check = await IndeximageOcrCheck_1.default
            .query()
            .where('id', checkId)
            .andWhere('companies_id', authenticate.companies_id)
            .first();
        if (!check)
            return response.status(404).send({ message: 'Conferência não encontrada' });
        const payload = {};
        if (applySheet && check.detected_sheet !== null && check.detected_sheet !== undefined) {
            payload.sheet = check.detected_sheet;
        }
        if (applyTerm && check.detected_term) {
            payload.approximate_term = check.detected_term;
        }
        if (!Object.keys(payload).length) {
            return response.status(422).send({ message: 'Nenhum campo detectado para aplicar' });
        }
        await Bookrecord_1.default
            .query()
            .where('id', check.bookrecords_id)
            .andWhere('companies_id', check.companies_id)
            .andWhere('typebooks_id', check.typebooks_id)
            .update(payload);
        if (payload.sheet !== undefined) {
            check.expected_sheet = payload.sheet;
            check.sheet_status = 'match';
        }
        if (payload.approximate_term !== undefined) {
            check.expected_term = payload.approximate_term;
            check.term_status = 'match';
        }
        check.auto_applied = false;
        check.review_status = 'corrected_manually';
        check.confidence_level = this.confidenceLevel(check.confidence);
        await check.save();
        return response.status(200).send({ check, applied: payload });
    }
}
exports.default = OcrConferencesController;
//# sourceMappingURL=OcrConferencesController.js.map