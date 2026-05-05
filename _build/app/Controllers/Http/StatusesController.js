"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Status_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Status"));
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class StatusesController {
    async index({ auth }) {
        const authenticate = await auth.use('api').authenticate();
        return await Status_1.default.query().where('companies_id', authenticate.companies_id).orderBy('id', 'asc');
    }
    async show({ auth, params, response }) {
        await auth.use('api').authenticate();
        const status = await Status_1.default.find(params.id);
        if (!status) {
            return response.notFound({ message: 'Status não encontrado' });
        }
        return status;
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
        const status = await Status_1.default.create({ ...payload, companiesId: authenticate.companies_id });
        return response.created(status);
    }
    async update({ auth, params, request, response }) {
        const status = await Status_1.default.find(params.id);
        if (!status) {
            return response.notFound({ message: 'Status não encontrado' });
        }
        const validationSchema = Validator_1.schema.create({
            description: Validator_1.schema.string.optional({ trim: true }, [
                Validator_1.rules.maxLength(255),
            ]),
            inactive: Validator_1.schema.boolean.optional(),
        });
        const payload = await request.validate({ schema: validationSchema });
        status.merge(payload);
        await status.save();
        return status;
    }
}
exports.default = StatusesController;
//# sourceMappingURL=StatusesController.js.map