"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueExport = exports.exportPath = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const zlib_1 = require("zlib");
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const CompanySpedyIntegration_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/CompanySpedyIntegration"));
const SpedyNfseExportJob_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/SpedyNfseExportJob"));
const SpedyServiceInvoice_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/SpedyServiceInvoice"));
const SpedyCompaniesService_1 = __importDefault(require("./SpedyCompaniesService"));
const exportDirectory = Application_1.default.tmpPath('spedy-nfse-exports');
const spedy = new SpedyCompaniesService_1.default();
let queue = Promise.resolve();
async function cleanupOldArchives() {
    await promises_1.default.mkdir(exportDirectory, { recursive: true });
    const names = await promises_1.default.readdir(exportDirectory);
    for (const name of names) {
        if (!/^\d+\.zip$/.test(name))
            continue;
        const file = path_1.default.join(exportDirectory, name);
        const stat = await promises_1.default.stat(file);
        if (stat.mtimeMs < Date.now() - 24 * 60 * 60 * 1000)
            await promises_1.default.unlink(file);
    }
}
function crc32(data) {
    let crc = 0xffffffff;
    for (const byte of data) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++)
            crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
}
class ZipWriter {
    constructor(file) {
        this.file = file;
        this.central = [];
        this.offset = 0;
    }
    async add(name, data) {
        const filename = Buffer.from(name, 'utf8');
        const compressed = (0, zlib_1.deflateRawSync)(data);
        const checksum = crc32(data);
        const local = Buffer.alloc(30);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4);
        local.writeUInt16LE(0x0800, 6);
        local.writeUInt16LE(8, 8);
        local.writeUInt32LE(checksum, 14);
        local.writeUInt32LE(compressed.length, 18);
        local.writeUInt32LE(data.length, 22);
        local.writeUInt16LE(filename.length, 26);
        await this.file.writeFile(local);
        await this.file.writeFile(filename);
        await this.file.writeFile(compressed);
        const entry = Buffer.alloc(46);
        entry.writeUInt32LE(0x02014b50, 0);
        entry.writeUInt16LE(20, 4);
        entry.writeUInt16LE(20, 6);
        entry.writeUInt16LE(0x0800, 8);
        entry.writeUInt16LE(8, 10);
        entry.writeUInt32LE(checksum, 16);
        entry.writeUInt32LE(compressed.length, 20);
        entry.writeUInt32LE(data.length, 24);
        entry.writeUInt16LE(filename.length, 28);
        entry.writeUInt32LE(this.offset, 42);
        this.central.push(entry, filename);
        this.offset += local.length + filename.length + compressed.length;
    }
    async finish() {
        const directory = Buffer.concat(this.central);
        const end = Buffer.alloc(22);
        end.writeUInt32LE(0x06054b50, 0);
        const count = this.central.length / 2;
        end.writeUInt16LE(count, 8);
        end.writeUInt16LE(count, 10);
        end.writeUInt32LE(directory.length, 12);
        end.writeUInt32LE(this.offset, 16);
        await this.file.writeFile(directory);
        await this.file.writeFile(end);
        await this.file.close();
    }
    async close() {
        await this.file.close();
    }
}
function exportPath(id) {
    return path_1.default.join(exportDirectory, `${id}.zip`);
}
exports.exportPath = exportPath;
async function run(jobId) {
    const job = await SpedyNfseExportJob_1.default.findOrFail(jobId);
    job.status = 'processing';
    await job.save();
    const failures = [];
    const ids = JSON.parse(job.invoiceIds);
    const integrations = new Map();
    let lastRequest = 0;
    let included = 0;
    let zip = null;
    try {
        await cleanupOldArchives();
        zip = new ZipWriter(await promises_1.default.open(exportPath(job.id), 'w'));
        for (const id of ids) {
            try {
                const invoice = await SpedyServiceInvoice_1.default.query()
                    .where('id', id).where('companies_id', job.companiesId)
                    .where('status', 'authorized').first();
                if (!invoice?.spedyInvoiceId)
                    throw new Error('Nota não autorizada ou indisponível');
                const key = `${invoice.companiesId}:${invoice.environment}`;
                let integration = integrations.get(key);
                if (!integration) {
                    integration = await CompanySpedyIntegration_1.default.query()
                        .where('companies_id', invoice.companiesId).where('environment', invoice.environment)
                        .where('active', true).firstOrFail();
                    if (!integration.spedyApiKey)
                        throw new Error('Integração Spedy sem chave ativa');
                    integrations.set(key, integration);
                }
                const wait = 1100 - (Date.now() - lastRequest);
                if (wait > 0)
                    await new Promise((resolve) => setTimeout(resolve, wait));
                lastRequest = Date.now();
                const fetchFile = () => job.format === 'xml'
                    ? spedy.getServiceInvoiceXml(integration, invoice.spedyInvoiceId)
                    : spedy.getServiceInvoicePdf(integration, invoice.spedyInvoiceId);
                let remote;
                try {
                    remote = await fetchFile();
                }
                catch (error) {
                    if (error.status !== 429)
                        throw error;
                    await new Promise((resolve) => setTimeout(resolve, 61000));
                    lastRequest = Date.now();
                    remote = await fetchFile();
                }
                const number = String(invoice.number || invoice.id).replace(/[^a-zA-Z0-9_-]/g, '_');
                await zip.add(`nfse-${number}-id-${invoice.id}.${job.format}`, remote.rawBody);
                included += 1;
            }
            catch (error) {
                if (['ENOSPC', 'EIO', 'EBADF'].includes(error.code))
                    throw error;
                failures.push({ id, message: String(error.message || 'Falha ao obter arquivo').slice(0, 300) });
            }
            job.processed += 1;
            job.failures = JSON.stringify(failures);
            await job.save();
        }
        if (failures.length)
            await zip.add('falhas.txt', Buffer.from(failures.map((item) => `ID ${item.id}: ${item.message}`).join('\n')));
        if (!included)
            throw new Error('Nenhum arquivo pôde ser obtido da Spedy');
        await zip.finish();
        zip = null;
        job.fileName = `nfse-${job.format}-${job.id}.zip`;
        job.status = 'completed';
        await job.save();
    }
    catch (error) {
        if (zip)
            await zip.close();
        await promises_1.default.unlink(exportPath(job.id)).catch(() => undefined);
        job.status = 'failed';
        job.errorMessage = error.message || 'Falha ao preparar o ZIP';
        await job.save();
    }
}
function enqueueExport(jobId) {
    queue = queue.then(() => run(jobId)).catch((error) => console.error('Falha no lote NFS-e', error));
}
exports.enqueueExport = enqueueExport;
//# sourceMappingURL=SpedyNfseExportService.js.map