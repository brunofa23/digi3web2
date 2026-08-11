"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const DocumentConfig_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/DocumentConfig"));
class DocumentconfigsController {
    async index({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const { typebooks_id } = request.only(['typebooks_id']);
        let query = "1=1";
        if (typebooks_id)
            query += ` and typebooks_id=${typebooks_id}`;
        try {
            const docConfig = await DocumentConfig_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .whereRaw(query);
            return response.status(200).send(docConfig);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, 'erro');
        }
    }
    async show({ auth, params, request, response }) {
        await auth.use('api').authenticate();
        try {
            const docConfig = await DocumentConfig_1.default.find(params.id);
            return response.status(200).send(docConfig);
        }
        catch (error) {
            throw new BadRequestException_1.default('Erro', 401, error);
        }
    }
    async update({ auth, request, params, response }) {
        await auth.use('api').authenticate();
        const payLoad = request.only(DocumentConfig_1.default.fillable);
        try {
            const documentconfig = await DocumentConfig_1.default.query().where('id', params.id).update(payLoad);
            return response.status(201).send(documentconfig);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request - update', 401, error);
        }
    }
}
exports.default = DocumentconfigsController;
//# sourceMappingURL=DocumentconfigsController.js.map