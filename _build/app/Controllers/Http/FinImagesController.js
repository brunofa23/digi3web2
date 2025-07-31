"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const FinImage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/FinImage"));
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
const path = require('path');
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
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
    async downloadfinimage({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const body = request.only(FinImage_1.default.fillable);
        const company = await Company_1.default.find(authenticate.companies_id);
        const parent = await (0, googledrive_1.sendSearchFile)(body.path, company.cloud);
        const extension = path.extname(body.file_name);
        const fileId = await (0, googledrive_1.sendSearchFile)(body.file_name, company.cloud, parent[0].id);
        const download = await (0, googledrive_1.sendDownloadFile)(fileId[0].id, extension, company?.cloud);
        return response.status(200).send(download);
    }
    async destroy({}) { }
}
exports.default = FinImagesController;
//# sourceMappingURL=FinImagesController.js.map