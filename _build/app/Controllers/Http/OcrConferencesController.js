"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const luxon_1 = require("luxon");
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
const Indeximage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Indeximage"));
const Bookrecord_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Bookrecord"));
const IndeximageOcrCheck_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/IndeximageOcrCheck"));
const IndeximageOcrEntity_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/IndeximageOcrEntity"));
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
const indexImageOcrConference_1 = global[Symbol.for('ioc.use')]("App/Services/ocr/indexImageOcrConference");
class OcrConferencesController {
    normalizeDriveFileName(value) {
        return String(value || '')
            .normalize('NFC')
            .trim()
            .toLowerCase();
    }
    numberOrNull(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }
    applyBookrecordFilters(query, filters, tableAlias = '') {
        const column = (field) => tableAlias ? `${tableAlias}.${field}` : field;
        const numericRanges = [
            ['cod', 'codstart', 'codend'],
            ['book', 'bookstart', 'bookend'],
            ['sheet', 'sheetstart', 'sheetend'],
            ['indexbook', 'indexbook', 'indexbookend'],
        ];
        for (const [field, startKey, endKey] of numericRanges) {
            const start = this.numberOrNull(filters[startKey]);
            const end = this.numberOrNull(filters[endKey]);
            if (start !== null && end !== null)
                query.whereBetween(column(field), [start, end]);
            else if (start !== null)
                query.where(column(field), '>=', start);
            else if (end !== null)
                query.where(column(field), '<=', end);
        }
        if (filters.year)
            query.where(column('year'), filters.year);
        if (filters.letter)
            query.where(column('letter'), filters.letter);
        if (filters.side && filters.side !== 'any')
            query.where(column('side'), filters.side);
        if (filters.obs)
            query.where(column('obs'), 'like', `%${filters.obs}%`);
        if (filters.approximateterm)
            query.where(column('approximate_term'), 'like', `%${filters.approximateterm}%`);
    }
    confidenceLevel(confidence) {
        const value = Number(confidence || 0);
        if (value >= 0.92)
            return 'high';
        if (value >= 0.7)
            return 'medium';
        return 'low';
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
        const typebooksId = Number(params.typebooks_id);
        const qs = request.qs();
        const page = Number(qs.page || 1);
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
                .andOnVal('checks.layout_profile', 'header_keyword');
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
        const typebooksId = Number(params.typebooks_id);
        const body = request.only([
            'layoutProfile',
            'limit',
            'force',
            'fileName',
            'bookrecords_id',
            'seq',
            'codStart',
            'codEnd',
            'bookStart',
            'bookEnd',
            'sheetStart',
            'sheetEnd',
            'indexbook',
            'indexbookEnd',
            'approximateTerm',
            'year',
            'letter',
            'side',
            'obs',
        ]);
        const layoutProfile = String(body.layoutProfile || 'header_keyword');
        const limit = Math.min(Math.max(Number(body.limit || 20), 1), 100);
        const force = Boolean(body.force);
        const singleFileName = String(body.fileName || '').trim();
        const bookrecordsId = Number(body.bookrecords_id);
        const sequence = Number(body.seq);
        if (!Number.isInteger(typebooksId) || typebooksId <= 0) {
            return response.status(400).send({ message: 'typebooks_id inválido' });
        }
        if (layoutProfile !== 'header_keyword') {
            return response.status(400).send({ message: 'Layout ainda não suportado nesta etapa' });
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
        const query = Indeximage_1.default
            .query()
            .preload('bookrecord')
            .where('companies_id', authenticate.companies_id)
            .andWhere('typebooks_id', typebooksId)
            .whereHas('bookrecord', (bookrecordQuery) => {
            bookrecordQuery
                .where('companies_id', authenticate.companies_id)
                .andWhere('typebooks_id', typebooksId);
            this.applyBookrecordFilters(bookrecordQuery, {
                codstart: body.codStart,
                codend: body.codEnd,
                bookstart: body.bookStart,
                bookend: body.bookEnd,
                sheetstart: body.sheetStart,
                sheetend: body.sheetEnd,
                indexbook: body.indexbook,
                indexbookend: body.indexbookEnd,
                approximateterm: body.approximateTerm,
                year: body.year,
                letter: body.letter,
                side: body.side,
                obs: body.obs,
            });
        })
            .orderBy('bookrecords_id', 'asc')
            .orderBy('seq', 'asc')
            .limit(limit);
        if (singleFileName)
            query.andWhere('file_name', singleFileName);
        if (Number.isInteger(bookrecordsId) && bookrecordsId > 0)
            query.andWhere('bookrecords_id', bookrecordsId);
        if (Number.isInteger(sequence) && sequence >= 0)
            query.andWhere('seq', sequence);
        if (!force) {
            query.whereNotExists((checkQuery) => {
                checkQuery
                    .from('indeximage_ocr_checks as checks')
                    .whereRaw('checks.companies_id = indeximages.companies_id')
                    .whereRaw('checks.typebooks_id = indeximages.typebooks_id')
                    .whereRaw('checks.bookrecords_id = indeximages.bookrecords_id')
                    .whereRaw('checks.seq = indeximages.seq')
                    .where('checks.layout_profile', layoutProfile);
            });
        }
        const indeximages = await query;
        const bookNumbers = Array.from(new Set(indeximages
            .map((item) => Number(item.bookrecord?.book || item.book))
            .filter((item) => Number.isInteger(item) && item > 0)));
        const driveFiles = singleFileName
            ? await (0, googledrive_1.sendSearchFile)(singleFileName, typebook.company.cloud, folder[0].id)
            : await (0, googledrive_1.sendListAllFilesMetadata)(typebook.company.cloud, folder, bookNumbers);
        const driveFilesByName = new Map();
        for (const file of driveFiles || []) {
            if (file?.name)
                driveFilesByName.set(this.normalizeDriveFileName(file.name), file);
        }
        const result = {
            processed: 0,
            skipped: 0,
            errors: [],
            checks: [],
        };
        for (const indeximage of indeximages) {
            const driveFile = driveFilesByName.get(this.normalizeDriveFileName(indeximage.file_name));
            if (!driveFile?.id) {
                result.skipped++;
                result.errors.push({ file_name: indeximage.file_name, message: 'Arquivo não encontrado no Google Drive' });
                continue;
            }
            try {
                const imageBuffer = await (0, googledrive_1.sendDownloadFileBuffer)(driveFile.id, typebook.company.cloud);
                const extracted = await (0, indexImageOcrConference_1.extractHeaderKeywordConference)(imageBuffer, indeximage.file_name);
                const expectedSheet = indeximage.bookrecord?.sheet ?? null;
                const expectedTerm = indeximage.bookrecord?.approximate_term ?? null;
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