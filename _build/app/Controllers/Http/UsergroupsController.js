"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const Usergroup_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Usergroup"));
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class UsergroupsController {
    async index({ auth, response }) {
        await auth.use('api').authenticate();
        try {
            const data = await Usergroup_1.default.query()
                .where('inactive', false)
                .orderBy('name');
            return response.ok(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Erro ao buscar lançamentos', 401, error);
        }
    }
    async store({ auth, request, response }) {
        await auth.use('api').authenticate();
        const body = await request.validate({
            schema: Validator_1.schema.create({
                name: Validator_1.schema.string({ trim: true }, [Validator_1.rules.maxLength(60)]),
                inactive: Validator_1.schema.boolean.optional(),
            }),
        });
        try {
            const data = await Usergroup_1.default.create(body);
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Erro ao criar grupo', 401, error);
        }
    }
}
exports.default = UsergroupsController;
//# sourceMappingURL=UsergroupsController.js.map