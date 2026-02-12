"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const ImageCertificate_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/ImageCertificate"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
const luxon_1 = require("luxon");
const promises_1 = __importDefault(require("fs/promises"));
async function uploadImage({ companiesId, marriedCertificateId, file, description, }) {
    if (!file || !file.isValid) {
        console.log('Arquivo inválido ou inexistente, ignorando.');
        return;
    }
    let bookId;
    let clientName;
    const query = ImageCertificate_1.default.query()
        .where('companies_id', companiesId);
    if (marriedCertificateId) {
        bookId = 2;
        query.andWhere('married_certificate_id', marriedCertificateId);
    }
    const lastImage = await query.orderBy('seq', 'desc').first();
    const newSeq = lastImage?.seq ? lastImage.seq + 1 : 1;
    const timestamp = luxon_1.DateTime.now().toFormat('yyyy-MM-dd_HH-mm-ss');
    const baseName = file.clientName.split('.').slice(0, -1).join('.');
    if (bookId === 2) {
        clientName = `${description || ''}_${baseName}_id${marriedCertificateId}_${timestamp}.${file.extname}`;
    }
    else {
        clientName = `${baseName}_${timestamp}.${file.extname}`;
    }
    const company = await Company_1.default.findOrFail(companiesId);
    const uploadPath = Application_1.default.tmpPath(`/certificatesUploads/Client_${company.id}`);
    await file.move(uploadPath, { name: clientName });
    let parentFolder = await (0, googledrive_1.sendSearchFile)(`${company.foldername}.CERTIFICATES`, company.cloud);
    if (parentFolder.length === 0) {
        const mainFolder = await (0, googledrive_1.sendSearchFile)(company.foldername, company.cloud);
        if (mainFolder.length === 0) {
            throw new BadRequestException_1.default('Pasta da empresa não encontrada no Google Drive.', 400);
        }
        await (0, googledrive_1.sendCreateFolder)(`${company.foldername}.CERTIFICATES`, company.cloud, mainFolder[0].id);
        parentFolder = await (0, googledrive_1.sendSearchFile)(`${company.foldername}.CERTIFICATES`, company.cloud);
    }
    await ImageCertificate_1.default.create({
        companies_id: companiesId,
        book_id: bookId,
        married_certificate_id: marriedCertificateId,
        ext: file.extname,
        file_name: clientName,
        description: description,
        seq: newSeq,
        path: `${company.foldername}.CERTIFICATES`,
    });
    const result = await (0, googledrive_1.sendUploadFiles)(parentFolder[0].id, uploadPath, clientName, company.cloud);
    const fullFilePath = `${uploadPath}/${clientName}`;
    try {
        await promises_1.default.unlink(fullFilePath);
        console.log(`Arquivo ${clientName} excluído de ${uploadPath}`);
    }
    catch (err) {
        console.error(`Erro ao excluir o arquivo local: ${err.message}`);
    }
    return result;
}
exports.uploadImage = uploadImage;
//# sourceMappingURL=uploadImages.js.map