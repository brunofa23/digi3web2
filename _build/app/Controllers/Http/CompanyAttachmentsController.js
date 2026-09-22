"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const CompanyAttachment_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/CompanyAttachment"));
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
const luxon_1 = require("luxon");
const crypto_1 = __importDefault(require("crypto"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const allowedExtensions = [
    'pdf',
    'txt',
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'webp',
    'tif',
    'tiff',
    'docx',
    'xls',
    'xlsx',
    'odt',
];
class CompanyAttachmentsController {
    async authenticateSuperuser(auth) {
        const authenticate = await auth.use('api').authenticate();
        if (!authenticate.superuser) {
            throw new BadRequestException_1.default('Acesso permitido apenas para super usuário', 403, 'company_attachment_forbidden');
        }
        return authenticate;
    }
    normalizeDescription(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 80) || 'documento';
    }
    getExtension(file) {
        return String(file.extname || path_1.default.extname(file.clientName).replace('.', '') || '').toLowerCase();
    }
    getMimeType(file, extension) {
        const fileType = String(file.type || '').toLowerCase();
        const fileSubtype = String(file.subtype || '').toLowerCase();
        if (fileType && fileSubtype) {
            return `${fileType}/${fileSubtype}`;
        }
        const mimeTypes = {
            pdf: 'application/pdf',
            txt: 'text/plain',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            bmp: 'image/bmp',
            webp: 'image/webp',
            tif: 'image/tiff',
            tiff: 'image/tiff',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            odt: 'application/vnd.oasis.opendocument.text',
        };
        return mimeTypes[extension] || 'application/octet-stream';
    }
    async ensureCompanyDriveFolder(company) {
        const digi3FolderId = await (0, googledrive_1.sendCreateFolder)('Digi3', company.cloud);
        const companiesFolderId = await (0, googledrive_1.sendCreateFolder)('Companies', company.cloud, digi3FolderId);
        const companyFolderId = await (0, googledrive_1.sendCreateFolder)(String(company.id), company.cloud, companiesFolderId);
        return companyFolderId;
    }
    buildFileName(companyId, description, extension) {
        const normalizedDescription = this.normalizeDescription(description);
        const identifier = crypto_1.default.randomBytes(4).toString('hex');
        return `company_id_${companyId}_${normalizedDescription}_${identifier}.${extension}`;
    }
    async index({ auth, params, response }) {
        await this.authenticateSuperuser(auth);
        const companyId = Number(params.companyId);
        await Company_1.default.findOrFail(companyId);
        const data = await CompanyAttachment_1.default
            .query()
            .where('companies_id', companyId)
            .whereNull('deleted_at')
            .orderBy('created_at', 'desc');
        return response.status(200).send(data);
    }
    async store({ auth, params, request, response }) {
        const authenticate = await this.authenticateSuperuser(auth);
        const companyId = Number(params.companyId);
        const company = await Company_1.default.findOrFail(companyId);
        const description = String(request.input('description') || '').trim();
        if (!description) {
            throw new BadRequestException_1.default('Descrição do documento é obrigatória', 400, 'company_attachment_description_required');
        }
        const file = request.file('file', {
            size: '20mb',
            extnames: allowedExtensions,
        });
        if (!file || !file.isValid) {
            throw new BadRequestException_1.default('Arquivo inválido ou não enviado', 400, 'company_attachment_invalid_file');
        }
        const extension = this.getExtension(file);
        if (!allowedExtensions.includes(extension)) {
            throw new BadRequestException_1.default('Extensão de arquivo não permitida', 400, 'company_attachment_invalid_extension');
        }
        const fileName = this.buildFileName(company.id, description, extension);
        const mimeType = this.getMimeType(file, extension);
        const uploadPath = Application_1.default.tmpPath(`/companyAttachments/Company_${company.id}`);
        let driveFileId;
        await file.move(uploadPath, { name: fileName });
        try {
            const driveFolderId = await this.ensureCompanyDriveFolder(company);
            const uploadResult = await (0, googledrive_1.sendUploadFiles)(driveFolderId, uploadPath, fileName, company.cloud, mimeType);
            driveFileId = uploadResult?.data?.id;
            if (!driveFileId) {
                throw new BadRequestException_1.default('Upload não retornou o ID do arquivo no Google Drive', 400, 'company_attachment_drive_upload_error');
            }
            const attachment = await CompanyAttachment_1.default.create({
                companiesId: company.id,
                description,
                originalName: file.clientName,
                fileName,
                mimeType,
                extension,
                size: file.size || null,
                driveFileId,
                driveFolderId,
                uploadedBy: authenticate.id || null,
            });
            return response.status(201).send(attachment);
        }
        catch (error) {
            if (driveFileId) {
                await (0, googledrive_1.sendDeleteFile)(driveFileId, company.cloud).catch(() => null);
            }
            throw error;
        }
        finally {
            await promises_1.default.unlink(`${uploadPath}/${fileName}`).catch(() => null);
        }
    }
    async download({ auth, params, response }) {
        await this.authenticateSuperuser(auth);
        const companyId = Number(params.companyId);
        const attachment = await CompanyAttachment_1.default
            .query()
            .where('id', params.id)
            .where('companies_id', companyId)
            .whereNull('deleted_at')
            .firstOrFail();
        const company = await Company_1.default.findOrFail(companyId);
        const download = await (0, googledrive_1.sendDownloadFile)(attachment.driveFileId, `.${attachment.extension}`, company.cloud);
        return response.status(200).send({
            ...download,
            fileName: attachment.originalName || attachment.fileName,
            mimeType: attachment.mimeType,
        });
    }
    async destroy({ auth, params, response }) {
        await this.authenticateSuperuser(auth);
        const companyId = Number(params.companyId);
        const attachment = await CompanyAttachment_1.default
            .query()
            .where('id', params.id)
            .where('companies_id', companyId)
            .whereNull('deleted_at')
            .firstOrFail();
        const company = await Company_1.default.findOrFail(companyId);
        await (0, googledrive_1.sendDeleteFile)(attachment.driveFileId, company.cloud).catch(() => null);
        attachment.deletedAt = luxon_1.DateTime.now();
        await attachment.save();
        return response.status(200).send({ success: true });
    }
}
exports.default = CompanyAttachmentsController;
//# sourceMappingURL=CompanyAttachmentsController.js.map