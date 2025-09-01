"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Entity_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Entity"));
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
class FinEntitiesController {
    async index({ auth, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const data = await Entity_1.default.query()
                .where('companies_id', authenticate.companies_id);
            return response.status(200).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, 'erro');
        }
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const querySchema = Validator_1.schema.create({
            description: Validator_1.schema.string.nullableAndOptional(),
            responsible: Validator_1.schema.string.nullableAndOptional(),
            phone: Validator_1.schema.string.nullableAndOptional(),
            obs: Validator_1.schema.string.nullableAndOptional(),
            inactive: Validator_1.schema.boolean.nullableAndOptional(),
            excluded: Validator_1.schema.boolean.nullableAndOptional(),
            limit_amount: Validator_1.schema.number.nullableAndOptional()
        });
        const input = request.all();
        if (input.limit_amount && typeof input.limit_amount === 'string') {
            input.limit_amount = Number((0, util_1.currencyConverter)(input.limit_amount));
        }
        const body = await request.validate({
            schema: querySchema,
            data: input
        });
        body.companies_id = authenticate.companies_id;
        try {
            const data = await Entity_1.default.create(body);
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async update({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const querySchema = Validator_1.schema.create({
            description: Validator_1.schema.string.nullableAndOptional(),
            responsible: Validator_1.schema.string.nullableAndOptional(),
            phone: Validator_1.schema.string.nullableAndOptional(),
            obs: Validator_1.schema.string.nullableAndOptional(),
            inactive: Validator_1.schema.boolean.nullableAndOptional(),
            excluded: Validator_1.schema.boolean.nullableAndOptional(),
        });
        const input = request.all();
        if (input.limit_amount && typeof input.limit_amount === 'string') {
            input.limit_amount = Number((0, util_1.currencyConverter)(input.limit_amount));
        }
        const body = await request.validate({
            schema: querySchema,
            data: input
        });
        body.companies_id = authenticate.companies_id;
        try {
            const data = await Entity_1.default.findOrFail(params.id);
            data.merge(body).save();
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
}
exports.default = FinEntitiesController;
//# sourceMappingURL=FinEntitiesController.js.map