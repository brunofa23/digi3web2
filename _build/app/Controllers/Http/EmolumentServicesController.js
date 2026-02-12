"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Service_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Service"));
const Emolument_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Emolument"));
class ServiceEmolumentsController {
    async index({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const service = await Service_1.default.query()
            .where('id', params.id)
            .where('companies_id', authenticate.companies_id)
            .firstOrFail();
        await service.load('emoluments', (q) => {
            q.where('companies_id', authenticate.companies_id).orderBy('name');
        });
        return response.ok(service.emoluments);
    }
    async store({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const emolumentIds = request.input('emolumentIds', []);
        const service = await Service_1.default.query()
            .where('id', params.id)
            .where('companies_id', authenticate.companies_id)
            .firstOrFail();
        const validIds = await Emolument_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .whereIn('id', emolumentIds)
            .select('id');
        await service.related('emoluments').attach(validIds.map((e) => e.id), (pivotRow) => {
            pivotRow.companies_id = authenticate.companies_id;
        });
        return response.ok({ message: 'Vínculos criados com sucesso' });
    }
    async destroy({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const service = await Service_1.default.query()
            .where('id', params.id)
            .where('companies_id', authenticate.companies_id)
            .firstOrFail();
        await service.related('emoluments').detach([Number(params.emolumentId)]);
        return response.ok({ message: 'Vínculo removido com sucesso' });
    }
}
exports.default = ServiceEmolumentsController;
//# sourceMappingURL=EmolumentServicesController.js.map