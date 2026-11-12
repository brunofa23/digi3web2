"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sideModelSummary = exports.bookSideModelRegistry = exports.bookSideVisualReadiness = exports.predictBookSideVisual = exports.extractBookSideVisualFeatures = exports.loadBookSideVisualModel = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const IndeximageSideModel_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/IndeximageSideModel"));
let extractorPromise = null;
async function loadBookSideVisualModel(companyId, typebookId, book, options = {}) {
    let registryAvailable = true;
    try {
        const query = IndeximageSideModel_1.default.query()
            .where('companies_id', companyId).andWhere('typebooks_id', typebookId)
            .andWhere((books) => books.where('book', book).orWhereRaw('JSON_CONTAINS(source_books, CAST(? AS JSON))', [String(book)]))
            .andWhere('status', 'ready')
            .whereNull('archived_at');
        if (options.modelId)
            query.andWhere('id', options.modelId);
        else if (!options.candidate)
            query.andWhere('active_slot', 1);
        const stored = await query.orderByRaw('CASE WHEN JSON_LENGTH(source_books) > 1 THEN 0 ELSE 1 END').orderBy('id', 'desc').first();
        if (stored?.model_data)
            return { ...stored.model_data, model_id: stored.id, source_model_id: stored.source_model_id || stored.model_data.source_model_id || null, source_books: stored.source_books || stored.model_data.source_books || [stored.model_data.source_book || stored.book], active: stored.active_slot === 1, validation_label_ids: stored.validation_label_ids || [], validation_accuracy_threshold: stored.validation_accuracy_threshold ?? stored.model_data.validation_accuracy_threshold ?? null };
        if (options.modelId)
            return null;
    }
    catch (error) {
        if (error.code !== 'ER_NO_SUCH_TABLE' && error.errno !== 1146)
            throw error;
        registryAvailable = false;
    }
    const file = Application_1.default.resourcesPath(`side-models/${companyId}-${typebookId}-${book}.json`);
    try {
        const model = JSON.parse(await promises_1.default.readFile(file, 'utf8'));
        if (model.company_id !== companyId || model.typebook_id !== typebookId || model.book !== book) {
            throw new Error('Escopo do modelo visual inválido');
        }
        if (registryAvailable && await IndeximageSideModel_1.default.query().where('version', model.version)
            .andWhere('companies_id', companyId).andWhere('typebooks_id', typebookId).first())
            return null;
        if (model.extractor !== 'Xenova/dinov2-small' || model.weights.length !== 1920) {
            throw new Error('Formato do modelo visual não suportado');
        }
        return model;
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return null;
        throw error;
    }
}
exports.loadBookSideVisualModel = loadBookSideVisualModel;
async function extractBookSideVisualFeatures(buffer, expectedHash) {
    if (!extractorPromise) {
        extractorPromise = (async () => {
            const { pipeline, env } = require('@huggingface/transformers');
            env.cacheDir = Application_1.default.tmpPath('side-vision-models');
            const extractor = await pipeline('image-feature-extraction', 'Xenova/dinov2-small', { dtype: 'q8', device: 'cpu' });
            extractor.processor.image_processor.do_center_crop = false;
            extractor.processor.image_processor.size = { width: 224, height: 224 };
            return extractor;
        })().catch((error) => {
            extractorPromise = null;
            throw error;
        });
    }
    const extractor = await extractorPromise;
    const encoderFile = path_1.default.join(Application_1.default.tmpPath('side-vision-models'), 'Xenova/dinov2-small/onnx/model_quantized.onnx');
    const encoderHash = crypto_1.default.createHash('sha256').update(await promises_1.default.readFile(encoderFile)).digest('hex');
    if (expectedHash && encoderHash !== expectedHash)
        throw new Error('Pesos do extrator visual diferentes dos usados no treinamento');
    const { RawImage } = require('@huggingface/transformers');
    const { Blob } = require('buffer');
    const image = await RawImage.fromBlob(new Blob([new Uint8Array(buffer)]));
    const features = await extractor(image);
    const [, tokens, dimensions] = features.dims;
    if (tokens !== 257 || dimensions !== 384)
        throw new Error('Dimensões inesperadas no extrator visual');
    const normalize = (values) => {
        const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)) || 1;
        return values.map((value) => value / norm);
    };
    const result = normalize(Array.from(features.data.slice(0, dimensions)));
    for (let qy = 0; qy < 2; qy++) {
        for (let qx = 0; qx < 2; qx++) {
            const mean = new Array(dimensions).fill(0);
            for (let y = qy * 8; y < (qy + 1) * 8; y++) {
                for (let x = qx * 8; x < (qx + 1) * 8; x++) {
                    const offset = (1 + y * 16 + x) * dimensions;
                    for (let d = 0; d < dimensions; d++)
                        mean[d] += features.data[offset + d] / 64;
                }
            }
            result.push(...normalize(mean));
        }
    }
    return { features: normalize(result), encoderHash };
}
exports.extractBookSideVisualFeatures = extractBookSideVisualFeatures;
function predictBookSideVisual(model, features) {
    if (features.length !== model.weights.length)
        throw new Error('Características incompatíveis com o modelo visual');
    const score = features.reduce((sum, value, index) => sum + value * model.weights[index], model.bias);
    if (!Number.isFinite(score))
        throw new Error('O modelo visual não produziu um resultado válido');
    return { side: score >= 0 ? 'F' : 'V', score };
}
exports.predictBookSideVisual = predictBookSideVisual;
async function bookSideVisualReadiness(model, lineage = new Set()) {
    let training = [];
    let trainingUnchanged = false;
    if (model.source_model_id) {
        const currentModelId = Number(model.model_id || 0);
        if (currentModelId && lineage.has(currentModelId))
            return { ready: false, trainingUnchanged: false, total: 0, required: 10, correct: 0, sides: { F: 0, V: 0 } };
        const nextLineage = new Set(lineage);
        if (currentModelId)
            nextLineage.add(currentModelId);
        if (model.training_updated) {
            const currentTraining = await Database_1.default.from('indeximage_side_labels as labels')
                .join('bookrecords as records', (join) => join.on('records.id', 'labels.bookrecords_id').andOn('records.companies_id', 'labels.companies_id').andOn('records.typebooks_id', 'labels.typebooks_id'))
                .where('labels.companies_id', model.company_id).andWhere('labels.typebooks_id', model.typebook_id)
                .whereIn('records.book', model.source_books?.length ? model.source_books : [model.book])
                .whereIn('labels.bookrecords_id', model.training_samples.map((sample) => sample.bookrecords_id))
                .select('labels.bookrecords_id', 'labels.seq', 'labels.label');
            trainingUnchanged = model.training_samples.every((sample) => currentTraining.some((row) => Number(row.bookrecords_id) === sample.bookrecords_id && Number(row.seq) === sample.seq && row.label === sample.label));
        }
        else {
            const source = await IndeximageSideModel_1.default.query()
                .where('id', model.source_model_id).andWhere('companies_id', model.company_id)
                .andWhere('typebooks_id', model.typebook_id).andWhere('status', 'ready').first();
            const sourceData = source?.model_data;
            if (sourceData && source) {
                const sourceReadiness = await bookSideVisualReadiness({ ...sourceData, model_id: source.id, validation_label_ids: source.validation_label_ids || [], validation_accuracy_threshold: source.validation_accuracy_threshold }, nextLineage);
                const sameWeights = sourceData.extractor_sha256 === model.extractor_sha256
                    && sourceData.bias === model.bias && sourceData.weights.length === model.weights.length
                    && sourceData.weights.every((weight, index) => weight === model.weights[index]);
                trainingUnchanged = sourceReadiness.ready && sameWeights;
                if (trainingUnchanged)
                    return { ready: true, trainingUnchanged: true, total: 0, required: 0, correct: 0, sides: { F: 0, V: 0 } };
            }
        }
    }
    else {
        training = await Database_1.default.from('indeximage_side_labels as labels')
            .join('bookrecords as records', (join) => join.on('records.id', 'labels.bookrecords_id').andOn('records.companies_id', 'labels.companies_id').andOn('records.typebooks_id', 'labels.typebooks_id'))
            .join('indeximages as images', (join) => join.on('images.bookrecords_id', 'labels.bookrecords_id').andOn('images.companies_id', 'labels.companies_id').andOn('images.typebooks_id', 'labels.typebooks_id').andOn('images.seq', 'labels.seq').andOn('images.drive_file_id', 'labels.drive_file_id'))
            .where('labels.companies_id', model.company_id).andWhere('labels.typebooks_id', model.typebook_id)
            .whereIn('records.book', model.source_books?.length ? model.source_books : [model.book])
            .whereIn('labels.bookrecords_id', model.training_samples.map((sample) => sample.bookrecords_id))
            .select('labels.bookrecords_id', 'labels.seq', 'labels.label', 'records.sheet', 'records.book');
        trainingUnchanged = model.training_samples.every((sample) => training.some((row) => Number(row.bookrecords_id) === sample.bookrecords_id && Number(row.seq) === sample.seq && row.label === sample.label));
    }
    const localTrainingSamples = model.source_model_id && !model.training_updated ? [] : model.training_samples;
    const validationBooks = (!model.source_model_id || model.training_updated) && (model.source_books?.length || 0) > 1 ? model.source_books : [model.book];
    const validationQuery = Database_1.default.from('indeximage_side_labels as labels')
        .join('bookrecords as records', (join) => join.on('records.id', 'labels.bookrecords_id').andOn('records.companies_id', 'labels.companies_id').andOn('records.typebooks_id', 'labels.typebooks_id'))
        .join('indeximages as images', (join) => join.on('images.bookrecords_id', 'labels.bookrecords_id').andOn('images.companies_id', 'labels.companies_id').andOn('images.typebooks_id', 'labels.typebooks_id').andOn('images.seq', 'labels.seq').andOn('images.drive_file_id', 'labels.drive_file_id'))
        .leftJoin('indeximage_ocr_checks as checks', (join) => join.on('checks.bookrecords_id', 'labels.bookrecords_id').andOn('checks.companies_id', 'labels.companies_id').andOn('checks.typebooks_id', 'labels.typebooks_id').andOn('checks.seq', 'labels.seq').andOnVal('checks.layout_profile', model.version))
        .where('labels.companies_id', model.company_id).andWhere('labels.typebooks_id', model.typebook_id).whereIn('records.book', validationBooks)
        .whereNotIn('labels.bookrecords_id', localTrainingSamples.map((sample) => sample.bookrecords_id))
        .whereIn('labels.label', ['F', 'V'])
        .select('labels.id', 'labels.label', 'records.book', 'records.sheet', 'checks.detected_side', 'checks.side_processed_at');
    if (model.validation_label_ids)
        validationQuery.whereIn('labels.id', model.validation_label_ids);
    const trainingSheets = new Set([...training, ...localTrainingSamples].map((row) => `${row.book || model.book}:${row.sheet}`));
    const validation = (await validationQuery).filter((row) => !trainingSheets.has(`${row.book}:${row.sheet}`));
    const seen = new Set();
    const correct = validation.filter((row) => {
        if (model.validation_hashes) {
            const hash = model.validation_hashes[String(row.id)];
            if (!hash || seen.has(hash))
                return false;
            seen.add(hash);
        }
        return row.side_processed_at && row.detected_side === row.label;
    }).length;
    const sides = { F: validation.filter((row) => row.label === 'F').length, V: validation.filter((row) => row.label === 'V').length };
    const required = model.source_model_id && !model.training_updated ? 10 : 40;
    const defaultThreshold = validationBooks.length > 1 ? 80 : 100;
    const configuredThreshold = Number(model.validation_accuracy_threshold);
    const accuracyThreshold = [80, 85, 90, 95, 100].includes(configuredThreshold) ? configuredThreshold : defaultThreshold;
    const requiredAccuracy = Math.ceil(required * accuracyThreshold / 100);
    const processed = validation.filter((row) => row.side_processed_at).length;
    const complete = validation.length >= required && processed >= required && correct >= requiredAccuracy && sides.F >= 5 && sides.V >= 5;
    return { ready: complete && (validationBooks.length > 1 || trainingUnchanged), trainingUnchanged, total: validation.length, required, correct, sides };
}
exports.bookSideVisualReadiness = bookSideVisualReadiness;
async function bookSideModelRegistry(companyId, typebookId, book) {
    try {
        const records = await IndeximageSideModel_1.default.query().where('companies_id', companyId)
            .andWhere('typebooks_id', typebookId)
            .whereNull('archived_at')
            .andWhere((books) => books.where('book', book).orWhereRaw('JSON_CONTAINS(source_books, CAST(? AS JSON))', [String(book)]))
            .orderByRaw('CASE WHEN JSON_LENGTH(source_books) > 1 THEN 0 ELSE 1 END').orderBy('id', 'desc')
            .select('id', 'companies_id', 'typebooks_id', 'book', 'source_books', 'source_model_id', 'version', 'status', 'phase', 'processed', 'total', 'training_samples', 'validation_label_ids', 'requested_by', 'active_slot', 'error_message', 'started_at', 'finished_at', 'created_at', 'updated_at');
        return { available: true, records };
    }
    catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE' || error.errno === 1146)
            return { available: false, records: [] };
        throw error;
    }
}
exports.bookSideModelRegistry = bookSideModelRegistry;
function sideModelSummary(model) {
    return { id: model.id, version: model.version, status: model.status, phase: model.phase,
        processed: model.processed, total: model.total, active: model.active_slot === 1,
        source_model_id: model.source_model_id || null,
        error_message: model.error_message, created_at: model.createdAt, finished_at: model.finished_at };
}
exports.sideModelSummary = sideModelSummary;
//# sourceMappingURL=bookSideVisualModel.js.map