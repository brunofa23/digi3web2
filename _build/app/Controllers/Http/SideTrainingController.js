"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const luxon_1 = require("luxon");
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
const IndeximageSideLabel_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/IndeximageSideLabel"));
const IndeximageOcrCheck_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/IndeximageOcrCheck"));
const IndeximageSideModel_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/IndeximageSideModel"));
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
const bookSideVisualModel_1 = global[Symbol.for('ioc.use')]("App/Services/ocr/bookSideVisualModel");
const bookSideModelTraining_1 = global[Symbol.for('ioc.use')]("App/Services/ocr/bookSideModelTraining");
const crypto_1 = __importDefault(require("crypto"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
class SideTrainingController {
    requestedModelId(ctx) {
        const value = ctx.request.input('modelId');
        if (value === undefined || value === null || value === '')
            return null;
        const id = Number(value);
        if (!Number.isInteger(id) || id <= 0)
            throw new BadRequestException_1.default('Versão do modelo inválida', 422);
        return id;
    }
    async modelContext(ctx, companyId, typebookId, book) {
        const registry = book ? await (0, bookSideVisualModel_1.bookSideModelRegistry)(companyId, typebookId, book) : { available: true, records: [] };
        const modelId = this.requestedModelId(ctx);
        if (modelId && !registry.records.some((record) => record.id === modelId))
            throw new BadRequestException_1.default('Modelo não encontrado neste livro', 404);
        const model = book ? await (0, bookSideVisualModel_1.loadBookSideVisualModel)(companyId, typebookId, book, { candidate: true, modelId }) : null;
        return { registry, model };
    }
    async storeLegacyModel(model, userId, trx) {
        if (model.model_id)
            return model;
        const existing = await IndeximageSideModel_1.default.query({ client: trx }).where('version', model.version).andWhere('companies_id', model.company_id).andWhere('typebooks_id', model.typebook_id).andWhere('book', model.book).first();
        if (existing)
            return { ...model, model_id: existing.id, active: existing.active_slot === 1, validation_label_ids: existing.validation_label_ids };
        const labels = await Database_1.default.from('indeximage_side_labels as labels').useTransaction(trx)
            .join('bookrecords as records', (join) => join.on('records.id', 'labels.bookrecords_id').andOn('records.companies_id', 'labels.companies_id').andOn('records.typebooks_id', 'labels.typebooks_id'))
            .where('labels.companies_id', model.company_id).andWhere('labels.typebooks_id', model.typebook_id).andWhere('records.book', model.book)
            .select('labels.*', 'records.sheet');
        const trainingIds = new Set(model.training_samples.map((sample) => sample.bookrecords_id));
        const validationIds = labels.filter((label) => !trainingIds.has(Number(label.bookrecords_id))).map((label) => Number(label.id));
        const ready = await (0, bookSideVisualModel_1.bookSideVisualReadiness)({ ...model, validation_label_ids: validationIds });
        const stored = await IndeximageSideModel_1.default.create({ companies_id: model.company_id, typebooks_id: model.typebook_id, book: model.book,
            version: model.version, status: 'ready', phase: 'ready', total: model.training_samples.length, processed: model.training_samples.length,
            training_samples: labels.filter((label) => trainingIds.has(Number(label.bookrecords_id))).map((label) => ({ label_id: Number(label.id), bookrecords_id: Number(label.bookrecords_id), seq: Number(label.seq), sheet: Number(label.sheet), label: label.label, drive_file_id: label.drive_file_id, file_name: label.file_name })),
            validation_label_ids: validationIds, model_data: model, requested_by: userId, active_slot: ready.ready ? 1 : null, finished_at: luxon_1.DateTime.utc(),
        }, { client: trx });
        return { ...model, model_id: stored.id, active: stored.active_slot === 1, validation_label_ids: validationIds };
    }
    requestedStage(ctx) {
        const stage = String(ctx.request.input('stage') || 'development');
        if (!['development', 'validation'].includes(stage))
            throw new BadRequestException_1.default('Etapa de revisão inválida', 422);
        return stage;
    }
    requestedBook(ctx) {
        const value = ctx.request.input('book');
        if (value === undefined || value === null || value === '')
            return null;
        const book = Number(value);
        if (!Number.isInteger(book) || book <= 0)
            throw new BadRequestException_1.default('Número do livro inválido', 422);
        return book;
    }
    async access(ctx) {
        const user = await ctx.auth.use('api').authenticate();
        const permissions = ctx.auth.use('api').token?.meta.payload.permissions || [];
        if (!(0, util_1.verifyPermission)(Boolean(user.superuser), permissions, 44)) {
            throw new BadRequestException_1.default('Acesso a conferência OCR não permitido', 403, 'ocr_conference_permission_required');
        }
        const typebooksId = Number(ctx.params.typebooks_id);
        if (!Number.isInteger(typebooksId) || typebooksId <= 0) {
            throw new BadRequestException_1.default('typebooks_id inválido', 400);
        }
        const typebook = await Typebook_1.default.query()
            .where('id', typebooksId)
            .andWhere('companies_id', user.companies_id)
            .first();
        if (!typebook)
            throw new BadRequestException_1.default('Livro não encontrado', 404);
        return { user, typebooksId, typebook };
    }
    async index(ctx) {
        const { user, typebooksId } = await this.access(ctx);
        const book = this.requestedBook(ctx);
        const stage = this.requestedStage(ctx);
        const { registry, model } = await this.modelContext(ctx, user.companies_id, typebooksId, book);
        if (stage === 'validation' && !model)
            throw new BadRequestException_1.default('Este livro ainda não tem modelo visual para validar', 422);
        const trainingIds = new Set(model?.training_samples.map((sample) => sample.bookrecords_id) || []);
        const rows = await IndeximageSideLabel_1.default.query()
            .where('companies_id', user.companies_id)
            .andWhere('typebooks_id', typebooksId)
            .orderBy('position', 'asc');
        const records = await Database_1.default.from('bookrecords')
            .where('companies_id', user.companies_id)
            .andWhere('typebooks_id', typebooksId)
            .whereIn('id', rows.map((row) => row.bookrecords_id))
            .select('id', 'cod', 'book', 'sheet', 'side');
        const recordById = new Map(records.map((record) => [Number(record.id), record]));
        const validationIds = new Set(registry.records.flatMap((record) => record.validation_label_ids || []));
        if (model && !model.model_id)
            rows.filter((row) => Number(recordById.get(row.bookrecords_id)?.book) === book && !trainingIds.has(row.bookrecords_id)).forEach((row) => validationIds.add(row.id));
        const selectedJob = registry.records.find((record) => record.id === this.requestedModelId(ctx));
        const queuedTrainingIds = new Set(selectedJob?.training_samples.map((sample) => sample.label_id) || []);
        const visibleRows = rows.filter((row) => {
            if (book !== null && Number(recordById.get(row.bookrecords_id)?.book) !== book)
                return false;
            if (stage === 'validation')
                return model?.validation_label_ids ? model.validation_label_ids.includes(row.id) : !trainingIds.has(row.bookrecords_id);
            return trainingIds.has(row.bookrecords_id) || queuedTrainingIds.has(row.id) || !validationIds.has(row.id);
        });
        const completed = visibleRows.length > 0 && visibleRows.every((row) => row.label !== null);
        const modelReadiness = model ? await (0, bookSideVisualModel_1.bookSideVisualReadiness)(model) : null;
        const audit = completed ? { matches: 0, divergent: 0, missing: 0, inconclusive: 0, cases: [] } : null;
        const evaluation = book !== null && visibleRows.length
            ? { method: stage === 'validation' ? `Modelo visual ${model.version}` : 'Regra atual de bordas', correct: 0, wrong: 0, not_found: 0, not_processed: 0, pending: 0, excluded: 0 }
            : null;
        const checkByImage = new Map();
        if (evaluation) {
            const checkQuery = Database_1.default.from('indeximage_ocr_checks')
                .where('companies_id', user.companies_id)
                .andWhere('typebooks_id', typebooksId)
                .whereIn('bookrecords_id', visibleRows.map((row) => row.bookrecords_id))
                .whereNotNull('side_processed_at')
                .orderBy('side_processed_at', 'desc')
                .orderBy('id', 'desc')
                .select('bookrecords_id', 'seq', 'detected_side', 'side_evidence', 'side_processed_at');
            if (stage === 'validation')
                checkQuery.andWhere('layout_profile', model.version);
            else
                checkQuery.whereIn('layout_profile', ['header_keyword', 'top_isolated_number']);
            const checks = await checkQuery;
            for (const check of checks) {
                const key = `${check.bookrecords_id}:${check.seq}`;
                if (!checkByImage.has(key))
                    checkByImage.set(key, check);
            }
        }
        const evaluatedItems = visibleRows.map((row) => {
            const check = checkByImage.get(`${row.bookrecords_id}:${row.seq}`);
            const detectedSide = ['F', 'V'].includes(check?.detected_side) ? check.detected_side : null;
            let detectionStatus = null;
            if (evaluation) {
                if (row.label === null)
                    detectionStatus = 'pending';
                else if (row.label === 'U')
                    detectionStatus = 'excluded';
                else if (!check)
                    detectionStatus = 'not_processed';
                else if (!detectedSide)
                    detectionStatus = 'not_found';
                else
                    detectionStatus = detectedSide === row.label ? 'correct' : 'wrong';
                evaluation[detectionStatus]++;
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
            };
        });
        if (audit) {
            for (const row of visibleRows) {
                if (row.label === 'U') {
                    audit.inconclusive++;
                    continue;
                }
                const record = recordById.get(row.bookrecords_id);
                const savedSide = String(record?.side || '').trim().toUpperCase();
                if (savedSide === row.label) {
                    audit.matches++;
                    continue;
                }
                const status = ['F', 'V'].includes(savedSide) ? 'divergent' : 'missing';
                if (status === 'divergent')
                    audit.divergent++;
                else
                    audit.missing++;
                audit.cases.push({
                    label_id: row.id,
                    bookrecords_id: row.bookrecords_id,
                    cod: record?.cod ?? null,
                    book: record?.book ?? null,
                    sheet: record?.sheet ?? null,
                    saved_side: savedSide || null,
                    reviewed_side: row.label,
                    status,
                });
            }
        }
        return ctx.response.ok({
            total: visibleRows.length,
            reviewed: visibleRows.filter((row) => row.label !== null).length,
            audit,
            evaluation,
            stage,
            model_registry_available: registry.available,
            models: registry.records.map(bookSideVisualModel_1.sideModelSummary),
            training_job: registry.records[0] ? (0, bookSideVisualModel_1.sideModelSummary)(registry.records[0]) : null,
            visual_model: model ? {
                model_id: model.model_id || null,
                active: Boolean(model.active),
                version: model.version,
                training_count: model.training_samples.length,
                development: model.development,
                training_unchanged: modelReadiness.trainingUnchanged,
                validation_ready: modelReadiness.ready,
                validation_total: modelReadiness.total,
                validation_correct: modelReadiness.correct,
            } : null,
            items: evaluatedItems,
        });
    }
    async modelStatus(ctx) {
        const { user, typebooksId } = await this.access(ctx);
        const book = this.requestedBook(ctx);
        if (!book)
            throw new BadRequestException_1.default('Selecione um livro', 422);
        const registry = await (0, bookSideVisualModel_1.bookSideModelRegistry)(user.companies_id, typebooksId, book);
        return ctx.response.ok({ available: registry.available, models: registry.records.map(bookSideVisualModel_1.sideModelSummary), training_job: registry.records[0] ? (0, bookSideVisualModel_1.sideModelSummary)(registry.records[0]) : null });
    }
    async trainModel(ctx) {
        const { user, typebooksId } = await this.access(ctx);
        const book = this.requestedBook(ctx);
        if (!book)
            throw new BadRequestException_1.default('Selecione um livro para treinar', 422);
        const { registry, model } = await this.modelContext(ctx, user.companies_id, typebooksId, book);
        if (!registry.available)
            throw new BadRequestException_1.default('O treinamento ainda não foi habilitado neste servidor. Contate o administrador', 503);
        const job = await Database_1.default.transaction(async (trx) => {
            await Typebook_1.default.query({ client: trx }).where('id', typebooksId).andWhere('companies_id', user.companies_id).forUpdate().firstOrFail();
            const busy = await IndeximageSideModel_1.default.query({ client: trx }).where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).andWhere('book', book).whereIn('status', ['queued', 'training']).first();
            if (busy)
                return busy;
            if (model && !model.model_id)
                await this.storeLegacyModel(model, user.id, trx);
            const labels = await Database_1.default.from('indeximage_side_labels as labels').useTransaction(trx)
                .join('bookrecords as records', (join) => join.on('records.id', 'labels.bookrecords_id').andOn('records.companies_id', 'labels.companies_id').andOn('records.typebooks_id', 'labels.typebooks_id'))
                .join('indeximages as images', (join) => join.on('images.bookrecords_id', 'labels.bookrecords_id').andOn('images.companies_id', 'labels.companies_id').andOn('images.typebooks_id', 'labels.typebooks_id').andOn('images.seq', 'labels.seq').andOn('images.drive_file_id', 'labels.drive_file_id'))
                .where('labels.companies_id', user.companies_id).andWhere('labels.typebooks_id', typebooksId).andWhere('records.book', book).whereIn('labels.label', ['F', 'V'])
                .orderBy('records.sheet').orderBy('records.cod').select('labels.id', 'labels.bookrecords_id', 'labels.seq', 'labels.label', 'labels.drive_file_id', 'labels.file_name', 'records.sheet');
            if (labels.length < 40 || !['F', 'V'].every((side) => labels.filter((label) => label.label === side).length >= 5)) {
                throw new BadRequestException_1.default('Revise pelo menos 40 imagens, incluindo cinco frentes e cinco versos. Use Adicionar imagens se necessário', 422);
            }
            return IndeximageSideModel_1.default.create({ companies_id: user.companies_id, typebooks_id: typebooksId, book,
                version: `sv-${crypto_1.default.randomUUID()}`, status: 'queued', phase: 'queued', total: labels.length, processed: 0,
                training_samples: labels.map((label) => ({ label_id: Number(label.id), bookrecords_id: Number(label.bookrecords_id), seq: Number(label.seq), sheet: Number(label.sheet), label: label.label, drive_file_id: label.drive_file_id, file_name: label.file_name })),
                validation_label_ids: [], requested_by: user.id,
            }, { client: trx });
        });
        (0, bookSideModelTraining_1.wakeBookSideTrainingWorker)();
        return ctx.response.accepted({ training_job: (0, bookSideVisualModel_1.sideModelSummary)(job), model_id: job.id });
    }
    async activateModel(ctx) {
        const { user, typebooksId } = await this.access(ctx);
        const book = this.requestedBook(ctx);
        if (!book)
            throw new BadRequestException_1.default('Selecione um livro', 422);
        const context = await this.modelContext(ctx, user.companies_id, typebooksId, book);
        if (!context.registry.available)
            throw new BadRequestException_1.default('O treinamento ainda não foi habilitado neste servidor. Contate o administrador', 503);
        if (!context.model)
            throw new BadRequestException_1.default('O modelo ainda não está pronto para validar', 422);
        const model = await Database_1.default.transaction(async (trx) => {
            await Typebook_1.default.query({ client: trx }).where('id', typebooksId).andWhere('companies_id', user.companies_id).forUpdate().firstOrFail();
            const candidate = await this.storeLegacyModel(context.model, user.id, trx);
            const readiness = await (0, bookSideVisualModel_1.bookSideVisualReadiness)(candidate);
            if (!readiness.ready)
                throw new BadRequestException_1.default('Conclua a validação independente de pelo menos 40 imagens, incluindo cinco frentes e cinco versos, sem erros, antes de ativar', 422);
            await IndeximageSideModel_1.default.query({ client: trx }).where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).andWhere('book', book).andWhere('active_slot', 1).update({ active_slot: null });
            await IndeximageSideModel_1.default.query({ client: trx }).where('id', candidate.model_id).andWhere('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).andWhere('book', book).andWhere('status', 'ready').update({ active_slot: 1 });
            return candidate;
        });
        return ctx.response.ok({ model_id: model.model_id, version: model.version, active: true });
    }
    async createSample(ctx) {
        const { user, typebooksId } = await this.access(ctx);
        const book = this.requestedBook(ctx);
        const stage = this.requestedStage(ctx);
        const context = await this.modelContext(ctx, user.companies_id, typebooksId, book);
        if (book !== null && !context.registry.available)
            throw new BadRequestException_1.default('O treinamento ainda não foi habilitado neste servidor. Contate o administrador', 503);
        let model = context.model;
        if (stage === 'validation' && !model)
            throw new BadRequestException_1.default('Este livro ainda não tem modelo visual para validar', 422);
        const additional = ctx.request.input('additional') === true;
        const replaceLabelId = Number(ctx.request.input('replaceLabelId')) || null;
        if (replaceLabelId && (stage !== 'validation' || !Number.isInteger(replaceLabelId) || replaceLabelId <= 0))
            throw new BadRequestException_1.default('Referência de substituição inválida', 422);
        await Database_1.default.transaction(async (trx) => {
            await Typebook_1.default.query({ client: trx })
                .where('id', typebooksId)
                .andWhere('companies_id', user.companies_id)
                .forUpdate()
                .firstOrFail();
            if (book !== null) {
                const registry = await (0, bookSideVisualModel_1.bookSideModelRegistry)(user.companies_id, typebooksId, book);
                if (registry.available) {
                    const busy = await IndeximageSideModel_1.default.query({ client: trx }).where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).andWhere('book', book).whereIn('status', ['queued', 'training']).first();
                    if (busy)
                        throw new BadRequestException_1.default('Aguarde o treinamento deste livro terminar antes de alterar a amostra', 409);
                    if (model && !model.model_id)
                        model = await this.storeLegacyModel(model, user.id, trx);
                }
            }
            const existingRows = await IndeximageSideLabel_1.default.query({ client: trx })
                .where('companies_id', user.companies_id)
                .andWhere('typebooks_id', typebooksId);
            if (book === null && existingRows.length)
                return;
            const selected = [];
            let existingForBook = [];
            let excludedRecords = [];
            let excludedSheets = [];
            let target = 40;
            if (book !== null) {
                const records = await Database_1.default.from('bookrecords')
                    .useTransaction(trx)
                    .where('companies_id', user.companies_id)
                    .andWhere('typebooks_id', typebooksId)
                    .whereIn('id', existingRows.map((row) => row.bookrecords_id))
                    .andWhere('book', book)
                    .select('id', 'sheet');
                excludedRecords = records.map((row) => Number(row.id));
                excludedSheets = records.map((row) => Number(row.sheet));
                const currentBookRows = existingRows.filter((row) => excludedRecords.includes(row.bookrecords_id));
                const registered = await IndeximageSideModel_1.default.query({ client: trx }).where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).andWhere('book', book).select('validation_label_ids');
                const validationIds = new Set(registered.flatMap((row) => row.validation_label_ids || []));
                const trainingIds = new Set(model?.training_samples.map((sample) => sample.bookrecords_id) || []);
                let currentRows = stage === 'validation'
                    ? currentBookRows.filter((row) => model?.validation_label_ids ? model.validation_label_ids.includes(row.id) : !trainingIds.has(row.bookrecords_id))
                    : currentBookRows.filter((row) => trainingIds.has(row.bookrecords_id) || !validationIds.has(row.id));
                if (replaceLabelId) {
                    const replacement = currentRows.find((row) => row.id === replaceLabelId);
                    if (!replacement)
                        throw new BadRequestException_1.default('Referência não encontrada nesta validação', 404);
                    const processed = await IndeximageOcrCheck_1.default.query({ client: trx }).where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId)
                        .andWhere('bookrecords_id', replacement.bookrecords_id).andWhere('seq', replacement.seq).andWhere('layout_profile', model.version).whereNotNull('side_processed_at').first();
                    if (processed)
                        throw new BadRequestException_1.default('Uma referência já avaliada não pode ser substituída. Para melhorar o modelo, treine uma nova versão', 422);
                    currentRows = currentRows.filter((row) => row.id !== replaceLabelId);
                }
                existingForBook = currentRows.map((row) => row.bookrecords_id);
                if (additional)
                    target = stage === 'validation'
                        ? currentRows.length + Math.max(0, 40 - currentRows.filter((row) => ['F', 'V'].includes(row.label || '')).length, 5 - currentRows.filter((row) => row.label === 'F').length, 5 - currentRows.filter((row) => row.label === 'V').length)
                        : currentRows.length + 20;
                if (replaceLabelId)
                    target = currentRows.length + 1;
                if (existingForBook.length >= target)
                    return;
            }
            const sampleQuery = () => Database_1.default.from('bookrecords as bookrecords')
                .useTransaction(trx)
                .join('indeximages as indeximages', (join) => {
                join.on('indeximages.bookrecords_id', 'bookrecords.id')
                    .andOn('indeximages.typebooks_id', 'bookrecords.typebooks_id')
                    .andOn('indeximages.companies_id', 'bookrecords.companies_id');
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
                    .whereIn('earlier.ext', ['.jpg', '.jpeg', '.png', '.webp']);
            });
            if (book !== null) {
                const query = sampleQuery()
                    .andWhere('bookrecords.book', book)
                    .orderByRaw("CRC32(CONCAT(bookrecords.id, ':side-training-book-v1'))")
                    .limit(target - existingForBook.length)
                    .select('bookrecords.id as bookrecords_id', 'indeximages.seq', 'indeximages.drive_file_id', 'indeximages.file_name');
                if (excludedRecords.length)
                    query.whereNotIn('bookrecords.id', excludedRecords);
                if (stage === 'validation')
                    query.whereNotIn('bookrecords.sheet', [...excludedSheets, ...model.training_samples.map((sample) => sample.sheet)]);
                const rows = await query;
                selected.push(...rows);
            }
            else {
                for (const side of ['F', 'V']) {
                    const rows = await sampleQuery()
                        .andWhere('bookrecords.side', side)
                        .orderByRaw("CRC32(CONCAT(bookrecords.id, ':side-training-v1'))")
                        .limit(20)
                        .select('bookrecords.id as bookrecords_id', 'indeximages.seq', 'indeximages.drive_file_id', 'indeximages.file_name');
                    selected.push(...rows);
                }
            }
            if (!selected.length)
                throw new BadRequestException_1.default('Não há novas imagens disponíveis para completar esta amostra neste livro', 422);
            const nextPosition = existingRows.reduce((max, row) => Math.max(max, row.position), 0) + 1;
            const created = await IndeximageSideLabel_1.default.createMany(selected.map((row, index) => ({
                companies_id: user.companies_id,
                typebooks_id: typebooksId,
                bookrecords_id: row.bookrecords_id,
                seq: row.seq,
                position: nextPosition + index,
                drive_file_id: row.drive_file_id,
                file_name: row.file_name,
            })), { client: trx });
            if (stage === 'validation' && model?.model_id) {
                const stored = await IndeximageSideModel_1.default.query({ client: trx }).where('id', model.model_id).andWhere('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).andWhere('book', book).forUpdate().firstOrFail();
                stored.validation_label_ids = [...stored.validation_label_ids.filter((id) => id !== replaceLabelId), ...created.map((row) => row.id)];
                await stored.save();
            }
        });
        return this.index(ctx);
    }
    async evaluateVisual(ctx) {
        const { user, typebooksId, typebook } = await this.access(ctx);
        const row = await IndeximageSideLabel_1.default.query()
            .where('id', Number(ctx.params.id))
            .andWhere('companies_id', user.companies_id)
            .andWhere('typebooks_id', typebooksId)
            .firstOrFail();
        if (!['F', 'V'].includes(row.label || ''))
            throw new BadRequestException_1.default('Revise a imagem antes de avaliar o modelo', 422);
        const record = await Database_1.default.from('bookrecords')
            .where('id', row.bookrecords_id).andWhere('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).first();
        if (!record)
            throw new BadRequestException_1.default('Registro não encontrado', 404);
        const model = (await this.modelContext(ctx, user.companies_id, typebooksId, Number(record.book))).model;
        if (!model)
            throw new BadRequestException_1.default('Modelo visual não disponível para este livro', 422);
        if (model.validation_label_ids && !model.validation_label_ids.includes(row.id))
            throw new BadRequestException_1.default('Esta imagem não pertence à validação desta versão do modelo', 422);
        if (model.training_samples.some((sample) => sample.bookrecords_id === row.bookrecords_id)) {
            throw new BadRequestException_1.default('Esta imagem foi usada no desenvolvimento e não pode ser usada na validação independente', 422);
        }
        const trainingRecords = await Database_1.default.from('bookrecords')
            .where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).andWhere('book', model.book)
            .whereIn('id', model.training_samples.map((sample) => sample.bookrecords_id)).select('sheet');
        if ([...trainingRecords, ...model.training_samples].some((sample) => Number(sample.sheet) === Number(record.sheet))) {
            throw new BadRequestException_1.default('Esta folha já participou do desenvolvimento. Use uma folha diferente para validação independente', 422);
        }
        const trainingRows = await IndeximageSideLabel_1.default.query()
            .where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId)
            .whereIn('bookrecords_id', model.training_samples.map((sample) => sample.bookrecords_id));
        if (!model.training_samples.every((sample) => trainingRows.some((label) => label.bookrecords_id === sample.bookrecords_id && label.seq === sample.seq && label.label === sample.label))) {
            throw new BadRequestException_1.default('As revisões usadas no treinamento mudaram. O modelo precisa ser revisto', 409);
        }
        const image = await Database_1.default.from('indeximages')
            .where('bookrecords_id', row.bookrecords_id).andWhere('companies_id', user.companies_id)
            .andWhere('typebooks_id', typebooksId).andWhere('seq', row.seq)
            .andWhere('drive_file_id', row.drive_file_id).first();
        if (!image)
            throw new BadRequestException_1.default('A imagem original da revisão foi alterada', 409);
        await typebook.load('company');
        if (!typebook.company?.cloud)
            throw new BadRequestException_1.default('Empresa sem configuração de cloud', 422);
        const buffer = await (0, googledrive_1.sendDownloadFileBuffer)(row.drive_file_id, typebook.company.cloud);
        const hash = crypto_1.default.createHash('sha256').update(buffer).digest('hex');
        if (model.training_samples.some((sample) => sample.sha256 === hash))
            throw new BadRequestException_1.default('Imagem duplicada do treinamento; não serve para validação independente', 422);
        const extracted = await (0, bookSideVisualModel_1.extractBookSideVisualFeatures)(buffer, model.extractor_sha256);
        const prediction = (0, bookSideVisualModel_1.predictBookSideVisual)(model, extracted.features);
        await Database_1.default.transaction(async (trx) => {
            if (model.model_id) {
                const stored = await IndeximageSideModel_1.default.query({ client: trx }).where('id', model.model_id).andWhere('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).andWhere('book', Number(record.book)).forUpdate().firstOrFail();
                const data = stored.model_data;
                if (data.validation_hashes) {
                    const duplicates = Object.entries(data.validation_hashes).filter(([labelId, value]) => Number(labelId) !== row.id && value === hash && stored.validation_label_ids.includes(Number(labelId))).map(([labelId]) => Number(labelId));
                    if (duplicates.length && await IndeximageSideLabel_1.default.query({ client: trx }).where('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).whereIn('id', duplicates).whereIn('label', ['F', 'V']).first()) {
                        throw new BadRequestException_1.default('Esta imagem repete outra referência da validação. Substitua esta referência por outra imagem', 422);
                    }
                    stored.model_data = { ...data, validation_hashes: { ...data.validation_hashes, [String(row.id)]: hash } };
                    await stored.save();
                }
            }
            await IndeximageOcrCheck_1.default.updateOrCreate({
                companies_id: user.companies_id, typebooks_id: typebooksId,
                bookrecords_id: row.bookrecords_id, seq: row.seq, layout_profile: model.version,
            }, {
                detected_side: prediction.side, side_confidence: null,
                side_evidence: model.model_id ? `Livro ${model.book} · versão ${model.model_id}` : model.version,
                side_processed_at: luxon_1.DateTime.local(), expected_sheet: record.sheet ?? null,
                sheet_status: 'not_found', term_status: 'not_found', review_status: 'pending', auto_applied: false,
            }, { client: trx });
        });
        return ctx.response.ok({ id: row.id, detected_side: prediction.side, model_version: model.version });
    }
    async updateLabel(ctx) {
        const { user, typebooksId } = await this.access(ctx);
        const id = Number(ctx.params.id);
        const label = String(ctx.request.input('label') || '').trim().toUpperCase();
        if (!Number.isInteger(id) || id <= 0 || !['F', 'V', 'U'].includes(label)) {
            throw new BadRequestException_1.default('Classificação inválida', 422);
        }
        const row = await IndeximageSideLabel_1.default.query()
            .where('id', id)
            .andWhere('companies_id', user.companies_id)
            .andWhere('typebooks_id', typebooksId)
            .first();
        if (!row)
            throw new BadRequestException_1.default('Imagem da amostra não encontrada', 404);
        const record = await Database_1.default.from('bookrecords').where('id', row.bookrecords_id).andWhere('companies_id', user.companies_id).andWhere('typebooks_id', typebooksId).first();
        if (!record)
            throw new BadRequestException_1.default('Registro não encontrado', 404);
        const registry = await (0, bookSideVisualModel_1.bookSideModelRegistry)(user.companies_id, typebooksId, Number(record.book));
        if (registry.records.some((model) => ['queued', 'training'].includes(model.status)))
            throw new BadRequestException_1.default('Aguarde o treinamento deste livro terminar antes de alterar as revisões', 409);
        const image = await Database_1.default.from('indeximages')
            .where('companies_id', user.companies_id)
            .andWhere('typebooks_id', typebooksId)
            .andWhere('bookrecords_id', row.bookrecords_id)
            .andWhere('seq', row.seq)
            .andWhere('drive_file_id', row.drive_file_id)
            .first();
        if (!image)
            throw new BadRequestException_1.default('A imagem original da amostra foi alterada', 409);
        row.label = label;
        row.reviewed_by = user.id;
        row.reviewed_at = luxon_1.DateTime.local();
        await row.save();
        return ctx.response.ok({ id: row.id, label: row.label, reviewed_at: row.reviewed_at });
    }
}
exports.default = SideTrainingController;
//# sourceMappingURL=SideTrainingController.js.map