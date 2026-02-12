"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Receipt_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Receipt"));
const ReceiptValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/ReceiptValidator"));
const EmployeeVerificationXReceipt_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/EmployeeVerificationXReceipt"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const luxon_1 = require("luxon");
class ReceiptsController {
    async index({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const page = Number(request.input('page', 1));
            const perPage = Number(request.input('perPage', 20));
            const query = Receipt_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .preload('service')
                .preload('orderCertificate')
                .preload('user')
                .preload('typebook')
                .preload('items', (itemsQuery) => {
                itemsQuery.preload('emolument').orderBy('id', 'asc');
            })
                .orderBy('id', 'desc');
            const orderCertificateId = request.input('orderCertificateId');
            if (orderCertificateId)
                query.where('order_certificate_id', orderCertificateId);
            const serviceId = request.input('serviceId');
            if (serviceId)
                query.where('service_id', serviceId);
            const status = request.input('status');
            if (status)
                query.where('status', status);
            const results = await query.paginate(page, perPage);
            return response.status(200).send(results);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, 'erro');
        }
    }
    async show({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const receipt = await Receipt_1.default.query()
                .where('companies_id', authenticate.companies_id)
                .where('id', params.id)
                .preload('service')
                .preload('orderCertificate')
                .preload('user')
                .preload('typebook')
                .preload('items', (itemsQuery) => {
                itemsQuery.preload('emolument').orderBy('id', 'asc');
            })
                .firstOrFail();
            return response.status(200).send(receipt);
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, 'erro');
        }
    }
    async validateEmolumentsInPivot(params) {
        const { trx, companiesId, serviceId, items } = params;
        if (!items?.length)
            return;
        const emolumentIds = items.map((i) => Number(i.emolumentId));
        const rows = await Database_1.default.from('emolument_service')
            .useTransaction(trx)
            .where('companies_id', companiesId)
            .where('service_id', serviceId)
            .whereIn('emolument_id', emolumentIds)
            .select('emolument_id');
        const allowed = new Set(rows.map((r) => Number(r.emolument_id)));
        const invalid = emolumentIds.filter((id) => !allowed.has(Number(id)));
        if (invalid.length) {
            throw new BadRequestException_1.default(`Emolumentos inválidos para o serviço ${serviceId}: ${invalid.join(', ')}`, 400, 'invalid_emoluments');
        }
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const trx = await Database_1.default.transaction();
        try {
            const payload = await request.validate(ReceiptValidator_1.default);
            const { items = [], ...receiptData } = payload;
            if (receiptData.status !== 'CANCELADO') {
                if (receiptData.dateStamp) {
                    receiptData.status = 'SELADO';
                }
                else {
                    receiptData.status = 'PROTOCOLADO';
                }
            }
            const receipt = await Receipt_1.default.create({
                ...receiptData,
                companiesId: authenticate.companies_id,
                userId: authenticate.id,
            }, { client: trx });
            await this.validateEmolumentsInPivot({
                trx,
                companiesId: authenticate.companies_id,
                serviceId: receipt.serviceId,
                items: items,
            });
            if (items.length) {
                await receipt.related('items').createMany(items.map((it) => ({
                    companiesId: authenticate.companies_id,
                    receiptId: receipt.id,
                    serviceId: receipt.serviceId,
                    emolumentId: it.emolumentId,
                    qtde: it.qtde ?? 1,
                    amount: it.amount ?? 0,
                })), { client: trx });
            }
            await EmployeeVerificationXReceipt_1.default.create({
                receiptId: receipt.id,
                companiesId: authenticate.companies_id,
                employeeVerificationId: 1,
                userId: authenticate.id,
                date: luxon_1.DateTime.local(),
            }, { client: trx });
            await trx.commit();
            await receipt.refresh();
            await receipt.load('service');
            await receipt.load('orderCertificate');
            await receipt.load('user');
            await receipt.load('typebook');
            await receipt.load('items', (q) => q.preload('emolument').orderBy('id', 'asc'));
            return response.status(201).send(receipt);
        }
        catch (error) {
            await trx.rollback();
            throw error;
        }
    }
    async update({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const trx = await Database_1.default.transaction();
        try {
            const receipt = await Receipt_1.default.query({ client: trx })
                .where('companies_id', authenticate.companies_id)
                .where('id', params.id)
                .firstOrFail();
            if (receipt.status === 'CANCELADO') {
                await trx.rollback();
                return response.status(400).send({
                    message: 'Recibo cancelado não pode ser alterado.',
                });
            }
            const payload = await request.validate(ReceiptValidator_1.default);
            const { items, ...receiptData } = payload;
            if (receiptData.status !== 'CANCELADO') {
                if (receiptData.dateStamp) {
                    receiptData.status = 'SELADO';
                }
                else {
                    receiptData.status = 'PROTOCOLADO';
                }
            }
            receipt.merge({
                ...receiptData,
                companiesId: authenticate.companies_id,
                userId: authenticate.id,
            });
            await receipt.save();
            if (items) {
                await this.validateEmolumentsInPivot({
                    trx,
                    companiesId: authenticate.companies_id,
                    serviceId: receipt.serviceId,
                    items: items,
                });
                await receipt.related('items').query({ client: trx }).delete();
                if (items.length) {
                    await receipt.related('items').createMany(items.map((it) => ({
                        companiesId: authenticate.companies_id,
                        receiptId: receipt.id,
                        serviceId: receipt.serviceId,
                        emolumentId: it.emolumentId,
                        qtde: it.qtde ?? 1,
                        amount: it.amount ?? 0,
                    })), { client: trx });
                }
            }
            await trx.commit();
            await receipt.refresh();
            await receipt.load('service');
            await receipt.load('orderCertificate');
            await receipt.load('user');
            await receipt.load('typebook');
            await receipt.load('items', (q) => q.preload('emolument').orderBy('id', 'asc'));
            return response.status(200).send(receipt);
        }
        catch (error) {
            await trx.rollback();
            throw error;
        }
    }
    async destroy({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const trx = await Database_1.default.transaction();
        try {
            const receipt = await Receipt_1.default.query({ client: trx })
                .where('companies_id', authenticate.companies_id)
                .where('id', params.id)
                .firstOrFail();
            await receipt.related('items').query({ client: trx }).delete();
            await receipt.delete();
            await trx.commit();
            return response.status(200).send({ message: 'Registro removido com sucesso' });
        }
        catch (error) {
            await trx.rollback();
            throw new BadRequestException_1.default('Bad Request', 401, 'erro');
        }
    }
}
exports.default = ReceiptsController;
//# sourceMappingURL=ReceiptsController.js.map