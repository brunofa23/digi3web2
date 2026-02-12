"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Service_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Service"));
const Emolument_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Emolument"));
const ServiceValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/ServiceValidator"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
class ServicesController {
    async index({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const query = Service_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .orderBy('name', 'asc');
            const inactive = request.input('inactive');
            if (inactive !== undefined) {
                const boolInactive = inactive === true || inactive === 'true' || inactive === 1 || inactive === '1';
                query.where('inactive', boolInactive);
            }
            const items = await query;
            return response.status(200).send(items);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 400, 'erro ao listar serviços');
        }
    }
    async show({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const item = await Service_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .where('id', params.id)
                .preload('emoluments')
                .firstOrFail();
            return response.status(200).send(item);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 404, 'serviço não encontrado');
        }
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const payload = await request.validate(ServiceValidator_1.default);
            const item = await Service_1.default.create({
                ...payload,
                companiesId: authenticate.companies_id,
            });
            return response.status(201).send(item);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 400, 'erro ao criar serviço');
        }
    }
    async update({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const payload = await request.validate(ServiceValidator_1.default);
            const item = await Service_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .where('id', params.id)
                .firstOrFail();
            item.merge({
                ...payload,
                companiesId: authenticate.companies_id,
            });
            await item.save();
            return response.status(200).send(item);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 400, 'erro ao atualizar serviço');
        }
    }
    async destroy({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const item = await Service_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .where('id', params.id)
                .firstOrFail();
            await item.delete();
            return response.status(200).send({ message: 'Serviço removido com sucesso' });
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 400, 'erro ao remover serviço');
        }
    }
    async syncEmoluments({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const companiesId = authenticate.companies_id;
        const emolumentIds = request.input('emolumentIds', []);
        const service = await Service_1.default.query()
            .where('id', params.id)
            .where('companies_id', companiesId)
            .firstOrFail();
        const valid = await Emolument_1.default.query()
            .where('companies_id', companiesId)
            .whereIn('id', emolumentIds)
            .select('id');
        const validIds = valid.map((e) => e.id);
        if (validIds.length !== emolumentIds.length) {
            return response.unprocessableEntity({
                message: 'Existem emoluments inválidos para esta empresa.',
            });
        }
        const payload = validIds.reduce((acc, id) => {
            acc[id] = { companies_id: companiesId };
            return acc;
        }, {});
        await service.related('emoluments').sync(payload);
        return response.ok({ message: 'Emoluments vinculados ao service com sucesso.' });
    }
}
exports.default = ServicesController;
//# sourceMappingURL=ServicesController.js.map