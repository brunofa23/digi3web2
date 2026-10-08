"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const AverbationDescription_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/AverbationDescription"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
class AverbationDescriptionsController {
    async allowed(auth) {
        const user = await auth.use('api').authenticate();
        const permissions = auth.use('api').token?.meta.payload.permissions || [];
        return { user, granted: (0, util_1.verifyPermission)(Boolean(user.superuser), permissions, 49) };
    }
    async index({ auth }) {
        const user = await auth.use('api').authenticate();
        return AverbationDescription_1.default.query()
            .where('companies_id', user.companies_id)
            .orderBy('id', 'asc');
    }
    async store({ auth, request, response }) {
        const { user, granted } = await this.allowed(auth);
        if (!granted)
            return response.forbidden({ message: 'Sem permissão para descrições de averbações' });
        const payload = await request.validate({ schema: Validator_1.schema.create({
                name: Validator_1.schema.string({ trim: true }, [Validator_1.rules.maxLength(255)]),
                description: Validator_1.schema.string.optional(),
                inactive: Validator_1.schema.boolean.optional(),
            }) });
        const item = await AverbationDescription_1.default.create({ ...payload, description: payload.description ?? '', companiesId: user.companies_id });
        return response.created(item);
    }
    async update({ auth, params, request, response }) {
        const { user, granted } = await this.allowed(auth);
        if (!granted)
            return response.forbidden({ message: 'Sem permissão para descrições de averbações' });
        const item = await AverbationDescription_1.default.query()
            .where('id', params.id)
            .where('companies_id', user.companies_id)
            .first();
        if (!item)
            return response.notFound({ message: 'Descrição de averbação não encontrada' });
        const payload = await request.validate({ schema: Validator_1.schema.create({
                name: Validator_1.schema.string({ trim: true }, [Validator_1.rules.maxLength(255)]),
                description: Validator_1.schema.string.optional(),
                inactive: Validator_1.schema.boolean(),
            }) });
        item.merge({ ...payload, description: payload.description ?? '' });
        await item.save();
        return item;
    }
}
exports.default = AverbationDescriptionsController;
//# sourceMappingURL=AverbationDescriptionsController.js.map