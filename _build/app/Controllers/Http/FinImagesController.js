"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const FinImage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/FinImage"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const luxon_1 = require("luxon");
class FinImagesController {
    async index({ auth, response }) {
        await auth.use('api').authenticate();
        try {
            const data = await FinImage_1.default.query();
            return response.status(200).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async store({ auth, request, response }) {
        try {
            const user = await auth.use('api').authenticate();
            const body = request.only(FinImage_1.default.fillable);
            console.log(request);
            const image = request.file('file', {
                size: '8mb',
                extnames: ['jpg', 'png', 'jpeg', 'pdf', 'xls', 'JPG', 'PNG', 'JPEG', 'PDF', 'XLS'],
            });
            if (!image || !image.isValid) {
                throw new BadRequestException_1.default('Erro', 401, 'Arquivo inválido ou não enviado.');
            }
            const lastImage = await FinImage_1.default.query()
                .where('companies_id', user.companies_id)
                .andWhere('fin_account_id', body.fin_account_id)
                .orderBy('seq', 'desc')
                .first();
            const newSeq = lastImage?.seq ? lastImage.seq + 1 : 1;
            const timestamp = luxon_1.DateTime.now().toFormat('yyyy-MM-dd_HH-mm-ss');
            const baseName = image.clientName.split('.').slice(0, -1).join('.');
            const clientName = `${baseName}_id${body.fin_account_id}_${timestamp}.${image.extname}`;
            const data = await FinImage_1.default.create({ ...body, file_name: clientName, seq: newSeq });
            const company = await Company_1.default.findOrFail(user.companies_id);
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
            await (0, googledrive_1.sendUploadFiles)(parentFolder[0].id, uploadPath, clientName, company.cloud);
            return response.created(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Erro ao processar a requisição.', 400, error);
        }
    }
    async show({ auth, params, response }) {
        await auth.use('api').authenticate();
        try {
            const data = await FinImage_1.default.findOrFail(params.id);
            return response.status(200).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async update({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const body = request.only(FinImage_1.default.fillable);
        try {
            const data = await FinImage_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .andWhere('id', params.id)
                .update(body);
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async destroy({}) { }
}
exports.default = FinImagesController;
//# sourceMappingURL=FinImagesController.js.map