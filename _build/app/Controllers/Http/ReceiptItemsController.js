"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ReceiptItem_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/ReceiptItem"));
const ReceiptitemValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/ReceiptitemValidator"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
class ReceiptItemsController {
    async index({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const { receiptId, serviceId, emolumentId } = request.qs();
        const query = ReceiptItem_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .preload('service')
            .preload('emolument')
            .preload('receipt')
            .orderBy('id', 'desc');
        if (receiptId)
            query.where('receipt_id', receiptId);
        if (serviceId)
            query.where('service_id', serviceId);
        if (emolumentId)
            query.where('emolument_id', emolumentId);
        const items = await query;
        return response.status(200).send(items);
    }
    async show({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const item = await ReceiptItem_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .where('id', params.id)
            .preload('service')
            .preload('emolument')
            .preload('receipt')
            .firstOrFail();
        return response.status(200).send(item);
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const payload = await request.validate(ReceiptitemValidator_1.default);
            const item = await ReceiptItem_1.default.create({
                companiesId: authenticate.companies_id,
                receiptId: payload.receiptId,
                serviceId: payload.serviceId,
                emolumentId: payload.emolumentId,
                qtde: payload.qtde ?? 0,
                amount: payload.amount ?? 0,
            });
            await item.load('service');
            await item.load('emolument');
            await item.load('receipt');
            return response.status(201).send(item);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 400, error?.messages ?? error);
        }
    }
    async update({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const payload = await request.validate(ReceiptitemValidator_1.default);
            const item = await ReceiptItem_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .where('id', params.id)
                .firstOrFail();
            item.receiptId = payload.receiptId;
            item.serviceId = payload.serviceId;
            item.emolumentId = payload.emolumentId;
            item.qtde = payload.qtde ?? item.qtde;
            item.amount = payload.amount ?? item.amount;
            await item.save();
            await item.load('service');
            await item.load('emolument');
            await item.load('receipt');
            return response.status(200).send(item);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 400, error?.messages ?? error);
        }
    }
    async destroy({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const item = await ReceiptItem_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .where('id', params.id)
            .firstOrFail();
        await item.delete();
        return response.status(200).send({ message: 'Registro removido com sucesso' });
    }
}
exports.default = ReceiptItemsController;
//# sourceMappingURL=ReceiptItemsController.js.map