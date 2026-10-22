"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const crypto_1 = __importDefault(require("crypto"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const pdf_lib_1 = require("pdf-lib");
const sessionTable = 'birth_mobile_capture_sessions';
const fileTable = 'birth_mobile_capture_files';
const maxPagesPerDocument = 5;
const fields = {
    DnvDocument: 'Declaração de Nascido Vivo (DNV)',
    DocumentFiliation1: 'Documento da filiação 1',
    DocumentFiliation2: 'Documento da filiação 2',
    DocumentDeclarant: 'Documento do declarante',
};
const deathFields = { DocumentDeceased: 'Documento do falecido' };
function fieldsFor(session) {
    return session.capture_type === 'death' ? deathFields : fields;
}
function captureDirectory(sessionId) {
    return Application_1.default.tmpPath('birth-mobile-captures', sessionId);
}
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
class BirthMobileCapturesController {
    async removeExpiredSessions() {
        const expired = await Database_1.default.from(sessionTable).whereRaw('expires_at <= CURRENT_TIMESTAMP');
        for (const session of expired) {
            await promises_1.default.rm(captureDirectory(session.id), { recursive: true, force: true });
        }
        if (expired.length) {
            await Database_1.default.from(sessionTable).whereIn('id', expired.map(({ id }) => id)).delete();
        }
    }
    async getValidPublicSession(token) {
        await this.removeExpiredSessions();
        return Database_1.default.from(sessionTable)
            .where('token_hash', hashToken(token))
            .whereRaw('expires_at > CURRENT_TIMESTAMP')
            .first();
    }
    async create({ auth, request, response }) {
        const user = await auth.use('api').authenticate();
        const captureType = String(request.input('captureType') || 'birth');
        if (!['birth', 'death'].includes(captureType))
            return response.badRequest({ message: 'Tipo de captura inválido.' });
        await this.removeExpiredSessions();
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const id = crypto_1.default.randomUUID();
        await Database_1.default.table(sessionTable).insert({
            id,
            companies_id: user.companies_id,
            created_by: user.id,
            token_hash: hashToken(token),
            capture_type: captureType,
            expires_at: Database_1.default.raw('DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE)'),
            created_at: Database_1.default.raw('CURRENT_TIMESTAMP'),
        });
        const session = await Database_1.default.from(sessionTable).where('id', id).select('expires_at').first();
        return response.created({ id, token, expiresAt: session?.expires_at, fields: captureType === 'death' ? deathFields : fields });
    }
    async showPublic({ request, response }) {
        response.header('Cache-Control', 'private, no-store, no-cache, must-revalidate');
        response.header('Pragma', 'no-cache');
        const token = String(request.header('x-capture-token') || '');
        if (!/^[a-f0-9]{64}$/i.test(token))
            return response.badRequest({ message: 'O QR Code não trouxe um código de captura válido.' });
        const session = await this.getValidPublicSession(token);
        if (!session)
            return response.status(410).send({ message: 'Sessão não encontrada ou expirada. Gere um novo QR Code no atendimento.' });
        const uploads = await Database_1.default.from(fileTable)
            .where('session_id', session.id)
            .select('field_key as fieldKey', 'file_name as fileName');
        const pageCounts = {};
        for (const upload of uploads) {
            try {
                const pdf = await pdf_lib_1.PDFDocument.load(await promises_1.default.readFile(path_1.default.join(captureDirectory(session.id), upload.fileName)));
                pageCounts[upload.fieldKey] = pdf.getPageCount();
            }
            catch {
                pageCounts[upload.fieldKey] = 0;
            }
        }
        return response.ok({
            fields: fieldsFor(session),
            uploadedFields: uploads.map(({ fieldKey }) => fieldKey),
            pageCounts,
            expiresAt: session.expires_at,
        });
    }
    async uploadPublic({ request, response }) {
        const token = String(request.header('x-capture-token') || '');
        if (!/^[a-f0-9]{64}$/i.test(token))
            return response.badRequest({ message: 'O QR Code não trouxe um código de captura válido.' });
        const session = await this.getValidPublicSession(token);
        if (!session)
            return response.status(410).send({ message: 'Sessão não encontrada ou expirada. Gere um novo QR Code no atendimento.' });
        const fieldKey = String(request.input('fieldKey') || '');
        const sessionFields = fieldsFor(session);
        if (!sessionFields[fieldKey])
            return response.badRequest({ message: 'Tipo de documento inválido.' });
        const pageId = String(request.input('pageId') || '');
        if (!/^[a-f0-9-]{36}$/i.test(pageId))
            return response.badRequest({ message: 'Identificador da foto inválido.' });
        const prior = await Database_1.default.from(fileTable).where('session_id', session.id).where('field_key', fieldKey).first();
        if (prior?.file_name === `${pageId}.pdf`) {
            let pageCount = 0;
            const pdf = await pdf_lib_1.PDFDocument.load(await promises_1.default.readFile(path_1.default.join(captureDirectory(session.id), prior.file_name)));
            pageCount = pdf.getPageCount();
            return response.ok({ fieldKey, label: sessionFields[fieldKey], pageCount, duplicate: true });
        }
        const file = request.file('file', { size: '8mb', extnames: ['pdf'] });
        if (!file?.isValid || !file.tmpPath)
            return response.badRequest({ message: 'Envie a página como PDF de até 8 MB.' });
        if (path_1.default.basename(file.clientName || '') !== `${fieldKey}.pdf`) {
            return response.badRequest({ message: 'O arquivo não corresponde ao tipo de documento selecionado. Selecione o documento correto e fotografe novamente.' });
        }
        const header = await promises_1.default.open(file.tmpPath, 'r');
        const signature = Buffer.alloc(5);
        try {
            await header.read(signature, 0, 5, 0);
        }
        finally {
            await header.close();
        }
        if (signature.toString() !== '%PDF-')
            return response.badRequest({ message: 'O arquivo enviado não é um PDF válido.' });
        let incomingPdf;
        try {
            incomingPdf = await pdf_lib_1.PDFDocument.load(await promises_1.default.readFile(file.tmpPath));
        }
        catch {
            return response.badRequest({ message: 'Não foi possível abrir a página enviada. Tente capturá-la novamente.' });
        }
        let existingPdf = null;
        if (prior) {
            try {
                existingPdf = await pdf_lib_1.PDFDocument.load(await promises_1.default.readFile(path_1.default.join(captureDirectory(session.id), prior.file_name)));
            }
            catch {
                return response.internalServerError({ message: 'O PDF salvo não pôde ser atualizado. Tente novamente.' });
            }
        }
        const totalPages = (existingPdf?.getPageCount() || 0) + incomingPdf.getPageCount();
        if (totalPages > maxPagesPerDocument) {
            return response.badRequest({ message: `Este documento pode ter até ${maxPagesPerDocument} páginas.` });
        }
        const mergedPdf = existingPdf || await pdf_lib_1.PDFDocument.create();
        if (existingPdf) {
            const newPages = await mergedPdf.copyPages(incomingPdf, incomingPdf.getPageIndices());
            newPages.forEach((page) => mergedPdf.addPage(page));
        }
        else {
            const newPages = await mergedPdf.copyPages(incomingPdf, incomingPdf.getPageIndices());
            newPages.forEach((page) => mergedPdf.addPage(page));
        }
        const mergedBytes = Buffer.from(await mergedPdf.save());
        const directory = captureDirectory(session.id);
        await promises_1.default.mkdir(directory, { recursive: true });
        const fileName = `${pageId}.pdf`;
        const newFilePath = path_1.default.join(directory, fileName);
        await promises_1.default.writeFile(newFilePath, mergedBytes);
        try {
            await Database_1.default.transaction(async (trx) => {
                if (prior)
                    await trx.from(fileTable).where('id', prior.id).delete();
                await trx.table(fileTable).insert({
                    session_id: session.id,
                    field_key: fieldKey,
                    file_name: fileName,
                    client_name: `${fieldKey}.pdf`,
                    size: mergedBytes.length,
                    created_at: Database_1.default.raw('CURRENT_TIMESTAMP'),
                });
            });
        }
        catch (error) {
            await promises_1.default.rm(newFilePath, { force: true });
            throw error;
        }
        if (prior)
            await promises_1.default.rm(path_1.default.join(directory, prior.file_name), { force: true });
        return response.created({ fieldKey, label: sessionFields[fieldKey], pageCount: totalPages });
    }
    async resetPublicFile({ request, response }) {
        const token = String(request.header('x-capture-token') || '');
        if (!/^[a-f0-9]{64}$/i.test(token))
            return response.badRequest({ message: 'O QR Code não trouxe um código de captura válido.' });
        const session = await this.getValidPublicSession(token);
        if (!session)
            return response.status(410).send({ message: 'Sessão não encontrada ou expirada. Gere um novo QR Code no atendimento.' });
        const fieldKey = String(request.input('fieldKey') || '');
        if (!fieldsFor(session)[fieldKey])
            return response.badRequest({ message: 'Tipo de documento inválido.' });
        const file = await Database_1.default.from(fileTable).where('session_id', session.id).where('field_key', fieldKey).first();
        if (!file)
            return response.ok({ fieldKey, cleared: false });
        await Database_1.default.from(fileTable).where('id', file.id).delete();
        await promises_1.default.rm(path_1.default.join(captureDirectory(session.id), file.file_name), { force: true });
        return response.ok({ fieldKey, cleared: true });
    }
    async index({ auth, params, response }) {
        const user = await auth.use('api').authenticate();
        const session = await Database_1.default.from(sessionTable)
            .where('id', params.id)
            .where('companies_id', user.companies_id)
            .where('created_by', user.id)
            .whereRaw('expires_at > CURRENT_TIMESTAMP')
            .first();
        if (!session)
            return response.notFound({ message: 'Sessão de captura não encontrada ou expirada.' });
        const files = await Database_1.default.from(fileTable)
            .where('session_id', session.id)
            .select('id', 'field_key as fieldKey', 'client_name as name', 'size');
        return response.ok({ id: session.id, expiresAt: session.expires_at, files });
    }
    async download({ auth, params, response }) {
        const user = await auth.use('api').authenticate();
        const file = await Database_1.default.from(fileTable)
            .join(sessionTable, `${sessionTable}.id`, `${fileTable}.session_id`)
            .where(`${fileTable}.id`, params.fileId)
            .where(`${sessionTable}.id`, params.id)
            .where(`${sessionTable}.companies_id`, user.companies_id)
            .where(`${sessionTable}.created_by`, user.id)
            .whereRaw(`${sessionTable}.expires_at > CURRENT_TIMESTAMP`)
            .select(`${fileTable}.file_name`, `${fileTable}.client_name`)
            .first();
        if (!file)
            return response.notFound({ message: 'Arquivo não encontrado ou sessão expirada.' });
        const filePath = path_1.default.join(captureDirectory(params.id), file.file_name);
        response.type('application/pdf');
        response.header('Cache-Control', 'private, no-store');
        response.header('Content-Disposition', `attachment; filename="${file.client_name}"`);
        return response.send(await promises_1.default.readFile(filePath));
    }
    async destroy({ auth, params, response }) {
        const user = await auth.use('api').authenticate();
        const session = await Database_1.default.from(sessionTable)
            .where('id', params.id)
            .where('companies_id', user.companies_id)
            .where('created_by', user.id)
            .first();
        if (!session)
            return response.noContent();
        await promises_1.default.rm(captureDirectory(session.id), { recursive: true, force: true });
        await Database_1.default.from(sessionTable).where('id', session.id).delete();
        return response.noContent();
    }
}
exports.default = BirthMobileCapturesController;
//# sourceMappingURL=BirthMobileCapturesController.js.map