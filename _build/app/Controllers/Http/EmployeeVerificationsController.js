"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EmployeeVerification_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/EmployeeVerification"));
const EmployeeVerificationValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/EmployeeVerificationValidator"));
class EmployeeVerificationsController {
    async index({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const qs = request.qs();
        const local = qs.local ?? null;
        const inactive = qs.inactive;
        const query = EmployeeVerification_1.default.query()
            .where('companiesId', authenticate.companies_id);
        if (local) {
            query.where('local', local);
        }
        if (inactive !== undefined) {
            const boolInactive = inactive === true || inactive === 'true' || inactive === 1 || inactive === '1';
            query.where('inactive', boolInactive);
        }
        const data = await query
            .orderBy('description', 'asc');
        return response.ok(data);
    }
    async show({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const item = await EmployeeVerification_1.default.query()
            .where('id', params.id)
            .where('companiesId', authenticate.companies_id)
            .first();
        if (!item) {
            return response.status(404).json({ message: 'Registro não encontrado' });
        }
        return item;
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        if (!authenticate.superuser) {
            return response.status(403).json({ message: 'Acesso permitido apenas para superusuário' });
        }
        const payload = await request.validate(EmployeeVerificationValidator_1.default);
        const item = await EmployeeVerification_1.default.create({
            ...payload,
            companiesId: authenticate.companies_id,
            inactive: payload.inactive ?? false,
        });
        return response.status(201).send(item);
    }
    async update({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        if (!authenticate.superuser) {
            return response.status(403).json({ message: 'Acesso permitido apenas para superusuário' });
        }
        const payload = await request.validate(EmployeeVerificationValidator_1.default);
        const item = await EmployeeVerification_1.default.query()
            .where('id', params.id)
            .where('companiesId', authenticate.companies_id)
            .first();
        if (!item) {
            return response.status(404).json({ message: 'Registro não encontrado' });
        }
        item.merge({
            description: payload.description,
            local: payload.local,
            inactive: payload.inactive ?? false,
        });
        await item.save();
        return item;
    }
    async destroy({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        if (!authenticate.superuser) {
            return response.status(403).json({ message: 'Acesso permitido apenas para superusuário' });
        }
        const item = await EmployeeVerification_1.default.query()
            .where('id', params.id)
            .where('companiesId', authenticate.companies_id)
            .first();
        if (!item) {
            return response.status(404).json({ message: 'Registro não encontrado' });
        }
        await item.delete();
        return response.status(200).send({ message: 'Verificação removida com sucesso' });
    }
}
exports.default = EmployeeVerificationsController;
//# sourceMappingURL=EmployeeVerificationsController.js.map