"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const FinClass_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/FinClass"));
const FinnClassStoreValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/FinnClassStoreValidator"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
class FinClassesController {
    async index({ auth, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const data = await FinClass_1.default.query()
                .where('companies_id', authenticate.companies_id);
            return response.status(200).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const input = request.all();
        if (input.limit_amount && typeof input.limit_amount === 'string') {
            input.limit_amount = Number((0, util_1.currencyConverter)(input.limit_amount));
        }
        input.companies_id = authenticate.companies_id;
        const body = await request.validate({
            schema: new FinnClassStoreValidator_1.default().schema,
            data: input,
        });
        try {
            const data = await FinClass_1.default.create(body);
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async show({ auth, params, response }) {
        await auth.use('api').authenticate();
        try {
            const data = await FinClass_1.default.findOrFail(params.id);
            return response.status(200).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async update({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const input = request.all();
        if (input.limit_amount && typeof input.limit_amount === 'string') {
            input.limit_amount = Number((0, util_1.currencyConverter)(input.limit_amount));
        }
        const body = await request.validate({
            schema: new FinnClassStoreValidator_1.default().schema,
            data: input,
        });
        try {
            const data = await FinClass_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .andWhere('id', params.id)
                .update(body);
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async destroy({}) { }
}
exports.default = FinClassesController;
//# sourceMappingURL=FinClassesController.js.map