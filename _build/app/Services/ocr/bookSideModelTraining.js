"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopBookSideTrainingWorker = exports.startBookSideTrainingWorker = exports.wakeBookSideTrainingWorker = exports.claimNextBookSideTrainingJob = exports.runBookSideTrainingJob = exports.verifySideTrainingSnapshot = void 0;
const crypto_1 = __importDefault(require("crypto"));
const worker_threads_1 = require("worker_threads");
const luxon_1 = require("luxon");
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const IndeximageSideModel_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/IndeximageSideModel"));
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
const bookSideVisualModel_1 = require("./bookSideVisualModel");
let timer = null;
let task = null;
let stopping = false;
let mathWorker = null;
const sqlNow = () => luxon_1.DateTime.utc().toSQL({ includeOffset: false });
const leaseEnd = () => luxon_1.DateTime.utc().plus({ minutes: 2 }).toSQL({ includeOffset: false });
async function verifySideTrainingSnapshot(job) {
    const rows = await Database_1.default.from('indeximage_side_labels as labels')
        .join('bookrecords as records', (join) => join.on('records.id', 'labels.bookrecords_id').andOn('records.companies_id', 'labels.companies_id').andOn('records.typebooks_id', 'labels.typebooks_id'))
        .join('indeximages as images', (join) => join.on('images.bookrecords_id', 'labels.bookrecords_id').andOn('images.companies_id', 'labels.companies_id').andOn('images.typebooks_id', 'labels.typebooks_id').andOn('images.seq', 'labels.seq').andOn('images.drive_file_id', 'labels.drive_file_id'))
        .where('labels.companies_id', job.companies_id).andWhere('labels.typebooks_id', job.typebooks_id).andWhere('records.book', job.book)
        .whereIn('labels.id', job.training_samples.map((sample) => sample.label_id))
        .select('labels.id', 'labels.bookrecords_id', 'labels.seq', 'labels.label', 'labels.drive_file_id', 'labels.file_name', 'records.sheet');
    const byId = new Map(rows.map((row) => [Number(row.id), row]));
    if (!job.training_samples.every((sample) => {
        const row = byId.get(sample.label_id);
        return row && Number(row.bookrecords_id) === sample.bookrecords_id && Number(row.seq) === sample.seq && Number(row.sheet) === sample.sheet && row.label === sample.label && row.drive_file_id === sample.drive_file_id && row.file_name === sample.file_name;
    }))
        throw new Error('As imagens ou revisões mudaram durante o treinamento. Confira a amostra e tente novamente');
}
exports.verifySideTrainingSnapshot = verifySideTrainingSnapshot;
async function downloadTrainingImage(fileId, cloud) {
    for (let attempt = 0;; attempt++) {
        let timeout;
        try {
            return await Promise.race([
                (0, googledrive_1.sendDownloadFileBuffer)(fileId, cloud),
                new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Tempo de leitura da imagem excedido')), 60000); }),
            ]);
        }
        catch (error) {
            if (attempt >= 1 || [400, 401, 403, 404].includes(error.response?.status))
                throw error;
        }
        finally {
            if (timeout)
                clearTimeout(timeout);
        }
    }
}
function fitInWorker(rows, shouldStop) {
    return new Promise((resolve, reject) => {
        const worker = new worker_threads_1.Worker(Application_1.default.resourcesPath('side-training/train.cjs'), { workerData: { rows } });
        mathWorker = worker;
        worker.on('message', (message) => {
            if (shouldStop()) {
                void worker.terminate();
                return;
            }
            if (message.error)
                reject(new Error(message.error));
            else if (message.result)
                resolve(message.result);
        });
        worker.once('error', reject);
        worker.once('exit', (code) => {
            if (mathWorker === worker)
                mathWorker = null;
            if (code !== 0)
                reject(new Error('Treinamento interrompido'));
        });
    });
}
async function runBookSideTrainingJob(job, shouldStop = () => stopping) {
    const token = job.lease_token;
    if (!token)
        throw new Error('O treinamento não possui uma reserva válida');
    let lostLease = false;
    const owned = () => IndeximageSideModel_1.default.query().where('id', job.id).andWhere('lease_token', token).andWhere('status', 'training');
    const heartbeat = setInterval(() => {
        void owned().update({ lease_expires_at: leaseEnd() }).then((updated) => { if (!updated)
            lostLease = true; }).catch(() => { lostLease = true; });
    }, 15000);
    heartbeat.unref();
    try {
        await verifySideTrainingSnapshot(job);
        const typebook = await Typebook_1.default.query().where('id', job.typebooks_id).andWhere('companies_id', job.companies_id).preload('company').first();
        if (!typebook?.company?.cloud)
            throw new Error('O livro está sem configuração de acesso às imagens');
        const rows = [];
        const hashes = new Map();
        let encoderHash = '';
        for (let index = 0; index < job.training_samples.length; index++) {
            if (shouldStop() || lostLease)
                throw new Error('Treinamento interrompido');
            const sample = job.training_samples[index];
            let buffer;
            try {
                buffer = await downloadTrainingImage(sample.drive_file_id, typebook.company.cloud);
            }
            catch {
                throw new Error(`Não foi possível carregar a imagem do registro ${sample.bookrecords_id}. Confira o acesso à imagem e tente novamente`);
            }
            const hash = crypto_1.default.createHash('sha256').update(buffer).digest('hex');
            if (hashes.has(hash) && hashes.get(hash) !== sample.label)
                throw new Error(`Há respostas diferentes para uma imagem duplicada. Confira o registro ${sample.bookrecords_id}`);
            if (!hashes.has(hash)) {
                const extracted = await (0, bookSideVisualModel_1.extractBookSideVisualFeatures)(buffer, encoderHash || undefined);
                encoderHash = extracted.encoderHash;
                rows.push({ ...sample, sha256: hash, features: extracted.features });
                hashes.set(hash, sample.label);
            }
            const updated = await owned().update({ processed: index + 1, lease_expires_at: leaseEnd() });
            if (!updated)
                throw new Error('A reserva do treinamento expirou');
        }
        if (rows.length < 40 || !['F', 'V'].every((side) => rows.filter((row) => row.label === side).length >= 5)) {
            throw new Error('Revise pelo menos 40 imagens diferentes, incluindo pelo menos cinco frentes e cinco versos. Adicione mais imagens à amostra');
        }
        await owned().update({ phase: 'fitting', lease_expires_at: leaseEnd() });
        const trained = await fitInWorker(rows, () => shouldStop() || lostLease);
        await verifySideTrainingSnapshot(job);
        if (shouldStop() || lostLease)
            throw new Error('Treinamento interrompido');
        const model = {
            version: job.version, company_id: job.companies_id, typebook_id: job.typebooks_id, book: job.book,
            extractor: 'Xenova/dinov2-small', extractor_sha256: encoderHash,
            feature_encoding: 'cls-and-2x2-spatial-means-normalized', runtime_version: '4.3.1',
            preprocessing: { resize: [224, 224], center_crop: false }, classifier: 'balanced-logistic-l2', lambda: 0.01,
            validation_hashes: {},
            ...trained,
            training_samples: rows.map((row) => ({ bookrecords_id: row.bookrecords_id, seq: row.seq, sheet: row.sheet, label: row.label, sha256: row.sha256 })),
        };
        await owned().update({ model_data: JSON.stringify(model), status: 'ready', phase: 'ready', finished_at: sqlNow(), lease_token: null, lease_expires_at: null, error_message: null });
    }
    catch (error) {
        await owned().update({ status: shouldStop() || lostLease ? 'queued' : 'failed', phase: shouldStop() || lostLease ? 'queued' : 'failed',
            error_message: shouldStop() || lostLease ? null : String(error.message || 'Falha no treinamento').slice(0, 1000), lease_token: null, lease_expires_at: null,
            finished_at: shouldStop() || lostLease ? null : sqlNow() });
    }
    finally {
        clearInterval(heartbeat);
    }
}
exports.runBookSideTrainingJob = runBookSideTrainingJob;
async function claimNextBookSideTrainingJob() {
    return Database_1.default.transaction(async (trx) => {
        const anchor = await IndeximageSideModel_1.default.query({ client: trx }).select('id').orderBy('id').forUpdate().first();
        if (!anchor)
            return null;
        const busy = await IndeximageSideModel_1.default.query({ client: trx }).select('id').where('status', 'training').where('lease_expires_at', '>', sqlNow()).first();
        if (busy)
            return null;
        const job = await IndeximageSideModel_1.default.query({ client: trx }).where((query) => {
            query.where('status', 'queued').orWhere((expired) => expired.where('status', 'training').where((lease) => lease.whereNull('lease_expires_at').orWhere('lease_expires_at', '<=', sqlNow())));
        }).orderBy('id').forUpdate().first();
        if (!job)
            return null;
        job.merge({ status: 'training', phase: 'extracting', processed: 0, lease_token: crypto_1.default.randomUUID(), lease_expires_at: luxon_1.DateTime.utc().plus({ minutes: 2 }), started_at: luxon_1.DateTime.utc(), error_message: null });
        await job.save();
        return job;
    });
}
exports.claimNextBookSideTrainingJob = claimNextBookSideTrainingJob;
function wakeBookSideTrainingWorker() {
    if (!timer || stopping || task)
        return;
    task = (async () => {
        try {
            while (!stopping) {
                const job = await claimNextBookSideTrainingJob();
                if (!job)
                    break;
                await runBookSideTrainingJob(job);
            }
        }
        catch (error) {
            if (error.code !== 'ER_NO_SUCH_TABLE' && error.errno !== 1146)
                console.error('Fila de treinamento de lados:', error.message);
        }
    })().finally(() => { task = null; });
}
exports.wakeBookSideTrainingWorker = wakeBookSideTrainingWorker;
function startBookSideTrainingWorker() {
    if (timer)
        return;
    stopping = false;
    timer = setInterval(wakeBookSideTrainingWorker, 5000);
    timer.unref();
    wakeBookSideTrainingWorker();
}
exports.startBookSideTrainingWorker = startBookSideTrainingWorker;
async function stopBookSideTrainingWorker() {
    stopping = true;
    if (timer)
        clearInterval(timer);
    timer = null;
    if (mathWorker)
        await mathWorker.terminate();
    await task;
}
exports.stopBookSideTrainingWorker = stopBookSideTrainingWorker;
//# sourceMappingURL=bookSideModelTraining.js.map