"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFinImage = void 0;
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const FinImage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/FinImage"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
const luxon_1 = require("luxon");
async function uploadFinImage(companies_id, fin_account_id, request) {
    console.log("passei na função....150011");
    const fileInput = request;
    const image = fileInput.file('fileInput', {
        size: '8mb',
        extnames: ['jpg', 'png', 'jpeg', 'pdf', 'xls', 'JPG', 'PNG', 'JPEG', 'PDF', 'XLS'],
    });
    if (!image || !image.isValid) {
        return;
    }
    const lastImage = await FinImage_1.default.query()
        .where('companies_id', companies_id)
        .andWhere('fin_account_id', fin_account_id)
        .orderBy('seq', 'desc')
        .first();
    const newSeq = lastImage?.seq ? lastImage.seq + 1 : 1;
    const timestamp = luxon_1.DateTime.now().toFormat('yyyy-MM-dd_HH-mm-ss');
    const baseName = image.clientName.split('.').slice(0, -1).join('.');
    const clientName = `${baseName}_id${fin_account_id}_${timestamp}.${image.extname}`;
    const company = await Company_1.default.findOrFail(companies_id);
    const uploadPath = Application_1.default.tmpPath(`/finuploads/Client_${company.id}`);
    await image.move(uploadPath, { name: clientName });
    let parentFolder = await (0, googledrive_1.sendSearchFile)(`${company.foldername}.FINANCIAL`, company.cloud);
    if (parentFolder.length === 0) {
        const mainFolder = await (0, googledrive_1.sendSearchFile)(company.foldername, company.cloud);
        if (mainFolder.length === 0) {
            throw new BadRequestException_1.default('Pasta da empresa não encontrada no Google Drive.', 400);
        }
        await (0, googledrive_1.sendCreateFolder)(`${company.foldername}.FINANCIAL`, company.cloud, mainFolder[0].id);
        parentFolder = await (0, googledrive_1.sendSearchFile)(`${company.foldername}.FINANCIAL`, company.cloud);
    }
    await FinImage_1.default.create({ companies_id, fin_account_id, ext: image.extname, file_name: clientName, seq: newSeq, path: `${company.foldername}.FINANCIAL` });
    const result = await (0, googledrive_1.sendUploadFiles)(parentFolder[0].id, uploadPath, clientName, company.cloud);
    return result;
}
exports.uploadFinImage = uploadFinImage;
//# sourceMappingURL=finImages.js.map