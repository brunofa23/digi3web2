"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const FinPaymentMethod_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/FinPaymentMethod"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
class FinPaymentMethodsController {
    async index({ auth, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const data = await FinPaymentMethod_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .where('excluded', false);
            return response.status(200).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const body = request.only(FinPaymentMethod_1.default.fillable);
        if (body.limit_amount && typeof body.limit_amount === 'string') {
            body.limit_amount = Number((0, util_1.currencyConverter)(body.limit_amount));
        }
        body.companies_id = authenticate.companies_id;
        try {
            const data = await FinPaymentMethod_1.default.create(body);
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
    async update({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const body = request.only(FinPaymentMethod_1.default.fillable);
        if (body.limit_amount && typeof body.limit_amount === 'string') {
            body.limit_amount = Number((0, util_1.currencyConverter)(body.limit_amount));
        }
        try {
            const data = await FinPaymentMethod_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .andWhere('id', params.id)
                .update(body);
            return response.status(201).send(data);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
}
exports.default = FinPaymentMethodsController;
//# sourceMappingURL=FinPaymentMethodsController.js.map