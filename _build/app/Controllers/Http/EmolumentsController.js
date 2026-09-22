"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
const Emolument_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Emolument"));
const EmolumentValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/EmolumentValidator"));
const EmolumentValidator_2 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/EmolumentValidator"));
class EmolumentsController {
    async index({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const page = Number(request.input('page', 1));
        const perPage = Number(request.input('perPage', 500));
        const q = String(request.input('q', '')).trim();
        const type = String(request.input('type', '')).trim();
        const query = Emolument_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .orderBy('name', 'asc');
        if (type)
            query.where('type', type);
        if (q) {
            query.where((builder) => {
                builder
                    .whereILike('name', `%${q}%`)
                    .orWhereILike('description', `%${q}%`)
                    .orWhereILike('code', `%${q}%`)
                    .orWhereILike('type', `%${q}%`);
            });
        }
        const data = await query.paginate(page, perPage);
        return response.ok(data);
    }
    async show({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const item = await Emolument_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .where('id', params.id)
            .firstOrFail();
        return response.ok(item);
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const payload = await request.validate(EmolumentValidator_1.default);
        const item = await Emolument_1.default.create({
            companiesId: authenticate.companies_id,
            name: payload.name,
            description: payload.description ?? null,
            price: await (0, util_1.currencyConverter)(payload.price),
            code: payload.code ?? null,
            type: payload.type,
            inactive: payload.inactive
        });
        return response.created(item);
    }
    async update({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const payload = await request.validate(EmolumentValidator_2.default);
        const item = await Emolument_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .where('id', params.id)
            .firstOrFail();
        const data = {
            ...payload,
            companiesId: undefined,
            price: await (0, util_1.currencyConverter)(payload.price)
        };
        item.merge(data);
        await item.save();
        return response.ok(item);
    }
    async destroy({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const item = await Emolument_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .where('id', params.id)
            .firstOrFail();
        await item.delete();
        return response.noContent();
    }
}
exports.default = EmolumentsController;
//# sourceMappingURL=EmolumentsController.js.map