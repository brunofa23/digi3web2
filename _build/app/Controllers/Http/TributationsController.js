"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Tributation_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Tributation"));
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class TributationsController {
    async index({ auth }) {
        const authenticate = await auth.use('api').authenticate();
        return await Tributation_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .orderBy('id', 'asc');
    }
    async show({ auth, params, response }) {
        await auth.use('api').authenticate();
        const tributation = await Tributation_1.default.find(params.id);
        if (!tributation) {
            return response.notFound({ message: 'Tributação não encontrada' });
        }
        return tributation;
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const validationSchema = Validator_1.schema.create({
            description: Validator_1.schema.string({ trim: true }, [
                Validator_1.rules.maxLength(255),
            ]),
            inactive: Validator_1.schema.boolean.optional(),
        });
        const payload = await request.validate({ schema: validationSchema });
        const tributation = await Tributation_1.default.create({
            ...payload,
            companiesId: authenticate.companies_id,
        });
        return response.created(tributation);
    }
    async update({ auth, params, request, response }) {
        await auth.use('api').authenticate();
        const tributation = await Tributation_1.default.find(params.id);
        if (!tributation) {
            return response.notFound({ message: 'Tributação não encontrada' });
        }
        const validationSchema = Validator_1.schema.create({
            description: Validator_1.schema.string.optional({ trim: true }, [
                Validator_1.rules.maxLength(255),
            ]),
            inactive: Validator_1.schema.boolean.optional(),
        });
        const payload = await request.validate({ schema: validationSchema });
        tributation.merge(payload);
        await tributation.save();
        return tributation;
    }
    async destroy({ auth, params, response }) {
        await auth.use('api').authenticate();
        const tributation = await Tributation_1.default.find(params.id);
        if (!tributation) {
            return response.notFound({ message: 'Tributação não encontrada' });
        }
        await tributation.delete();
        return response.ok({ message: 'Tributação removida com sucesso' });
    }
}
exports.default = TributationsController;
//# sourceMappingURL=TributationsController.js.map