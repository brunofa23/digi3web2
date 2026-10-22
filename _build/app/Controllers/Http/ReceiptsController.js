"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Receipt_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Receipt"));
const ReceiptItem_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/ReceiptItem"));
const Service_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Service"));
const ReceiptValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/ReceiptValidator"));
const EmployeeVerificationXReceipt_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/EmployeeVerificationXReceipt"));
const EmployeeVerification_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/EmployeeVerification"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const luxon_1 = require("luxon");
const OrderCertificate_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/OrderCertificate"));
const ReceiptPayment_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/ReceiptPayment"));
const SpedyServiceInvoice_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/SpedyServiceInvoice"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const Groupxpermission_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Groupxpermission"));
const AuditLog_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/AuditLog"));
const Hash_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Hash"));
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const CANCEL_RECEIPT_PERMISSION_ID = 48;
class ReceiptsController {
    async emolumentsAnalyticReport({ auth, request, response }) {
        const user = await auth.use('api').authenticate();
        const filters = await request.validate({ schema: Validator_1.schema.create({
                dateType: Validator_1.schema.enum(['stamp', 'protocol']),
                dateStart: Validator_1.schema.date({ format: 'yyyy-MM-dd' }),
                dateEnd: Validator_1.schema.date({ format: 'yyyy-MM-dd' }),
                valueType: Validator_1.schema.enum(['value', 'withoutValue']),
                unsealedOnly: Validator_1.schema.boolean.optional(),
                transferOfFunds: Validator_1.schema.enum.optional(['all', 'transfer', 'exclude']),
            }) });
        if (filters.dateEnd < filters.dateStart) {
            throw new BadRequestException_1.default('A data final deve ser igual ou posterior à data inicial.', 422, 'invalid_report_period');
        }
        const start = filters.dateStart.toISODate();
        const end = filters.dateEnd.toISODate();
        const dateColumn = filters.dateType === 'stamp' ? 'date_stamp' : 'date_protocol';
        const transferFilter = filters.transferOfFunds === 'transfer' ? 1 : 0;
        const filterItems = filters.transferOfFunds === 'transfer' || filters.transferOfFunds === 'exclude';
        const totalExpression = filterItems
            ? `(SELECT COALESCE(SUM(ri.qtde * ri.amount), 0) FROM receipt_items ri INNER JOIN emoluments e ON e.id = ri.emolument_id AND e.companies_id = ri.companies_id WHERE ri.receipt_id = receipts.id AND ri.companies_id = receipts.companies_id AND e.transfer_of_found = ${transferFilter})`
            : '(SELECT COALESCE(SUM(ri.qtde * ri.amount), 0) FROM receipt_items ri WHERE ri.receipt_id = receipts.id AND ri.companies_id = receipts.companies_id)';
        const page = Math.max(1, Number(request.input('page', 1)) || 1);
        const query = Receipt_1.default.query()
            .where('companies_id', user.companies_id)
            .where((q) => q.whereNull('status').orWhereNotIn('status', ['CANCELADO', 'EXCLUIDO']))
            .whereNotNull(dateColumn)
            .whereRaw(`${totalExpression} ${filters.valueType === 'value' ? '>' : '='} ?`, [0])
            .orderBy(dateColumn, 'asc')
            .orderBy('id', 'asc');
        if (filterItems) {
            query.whereHas('items', (itemsQuery) => itemsQuery
                .where('companies_id', user.companies_id)
                .whereHas('emolument', (emolumentQuery) => emolumentQuery
                .where('companies_id', user.companies_id)
                .where('transfer_of_found', transferFilter)));
            query.preload('items', (itemsQuery) => itemsQuery
                .where('companies_id', user.companies_id)
                .whereHas('emolument', (emolumentQuery) => emolumentQuery
                .where('companies_id', user.companies_id)
                .where('transfer_of_found', transferFilter))
                .preload('emolument'));
        }
        else {
            query.preload('service', (serviceQuery) => serviceQuery.preload('emoluments'))
                .preload('items');
        }
        if (filters.dateType === 'stamp') {
            query.whereBetween('date_stamp', [start, end]);
        }
        else {
            query.where('date_protocol', '>=', `${start} 00:00:00`)
                .where('date_protocol', '<', filters.dateEnd.plus({ days: 1 }).toFormat('yyyy-MM-dd 00:00:00'));
            if (filters.unsealedOnly)
                query.whereNull('date_stamp');
        }
        const result = await query.paginate(page, 100);
        return response.ok({
            ...result.serialize(),
            data: result.all().map((receipt) => ({
                receiptId: receipt.id,
                name: receipt.registered1 ?? null,
                book: receipt.book ?? null,
                sheet: receipt.sheet ?? null,
                dateProtocol: receipt.dateProtocol ?? null,
                actCodes: [...new Set((filterItems ? receipt.items.map((item) => item.emolument) : (receipt.service?.emoluments ?? []))
                        .filter((emolument) => emolument.type === 'EMOLUMENTOS')
                        .map((emolument) => String(emolument.code ?? '').trim())
                        .filter(Boolean))].join(','),
                total: receipt.items.reduce((sum, item) => sum + Number(item.qtde) * Number(item.amount), 0),
            })),
        });
    }
    async emolumentsSyntheticReport({ auth, request, response }) {
        const user = await auth.use('api').authenticate();
        const filters = await request.validate({ schema: Validator_1.schema.create({
                dateType: Validator_1.schema.enum(['stamp', 'protocol']),
                dateStart: Validator_1.schema.date({ format: 'yyyy-MM-dd' }),
                dateEnd: Validator_1.schema.date({ format: 'yyyy-MM-dd' }),
                valueType: Validator_1.schema.enum(['value', 'withoutValue']),
                unsealedOnly: Validator_1.schema.boolean.optional(),
                transferOfFunds: Validator_1.schema.enum.optional(['all', 'transfer', 'exclude']),
            }) });
        if (filters.dateEnd < filters.dateStart) {
            throw new BadRequestException_1.default('A data final deve ser igual ou posterior à data inicial.', 422, 'invalid_report_period');
        }
        const start = filters.dateStart.toISODate();
        const end = filters.dateEnd.toISODate();
        const dateColumn = filters.dateType === 'stamp' ? 'r.date_stamp' : 'r.date_protocol';
        const filterItems = filters.transferOfFunds === 'transfer' || filters.transferOfFunds === 'exclude';
        const transferFilter = filters.transferOfFunds === 'transfer' ? 1 : 0;
        const totalExpression = filterItems
            ? `(SELECT COALESCE(SUM(items.qtde * items.amount), 0) FROM receipt_items items INNER JOIN emoluments filtered_emoluments ON filtered_emoluments.id = items.emolument_id AND filtered_emoluments.companies_id = items.companies_id WHERE items.receipt_id = r.id AND items.companies_id = r.companies_id AND filtered_emoluments.transfer_of_found = ${transferFilter})`
            : '(SELECT COALESCE(SUM(items.qtde * items.amount), 0) FROM receipt_items items WHERE items.receipt_id = r.id AND items.companies_id = r.companies_id)';
        const query = Database_1.default.from('receipt_items as ri')
            .innerJoin('receipts as r', 'r.id', 'ri.receipt_id')
            .innerJoin('emoluments as e', 'e.id', 'ri.emolument_id')
            .where('r.companies_id', user.companies_id)
            .where('ri.companies_id', user.companies_id)
            .where('e.companies_id', user.companies_id)
            .where((q) => q.whereNull('r.status').orWhereNotIn('r.status', ['CANCELADO', 'EXCLUIDO']))
            .whereNotNull(dateColumn)
            .whereRaw(`${totalExpression} ${filters.valueType === 'value' ? '>' : '='} ?`, [0])
            .select('e.id as code', 'e.name as name', 'e.code as actCode', 'e.type as type', 'e.transfer_of_found as transferOfFunds')
            .select(Database_1.default.raw('SUM(ri.qtde) AS quantity'), Database_1.default.raw('SUM(ri.qtde * ri.amount) AS total'))
            .groupBy('e.id', 'e.name', 'e.code', 'e.type', 'e.transfer_of_found')
            .orderBy('e.type', 'asc')
            .orderBy('e.id', 'asc');
        if (filters.dateType === 'stamp') {
            query.whereBetween('r.date_stamp', [start, end]);
        }
        else {
            query.where('r.date_protocol', '>=', `${start} 00:00:00`)
                .where('r.date_protocol', '<', filters.dateEnd.plus({ days: 1 }).toFormat('yyyy-MM-dd 00:00:00'));
            if (filters.unsealedOnly)
                query.whereNull('r.date_stamp');
        }
        if (filterItems) {
            query.where('e.transfer_of_found', transferFilter);
        }
        return response.ok(await query);
    }
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
            if (request.input('activeOnly') === 'true') {
                query.where((q) => q.whereNull('status').orWhereNot('status', 'EXCLUIDO'));
            }
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
            const service = await Service_1.default.query({ client: trx })
                .where('companies_id', authenticate.companies_id).where('id', receiptData.serviceId).firstOrFail();
            receiptData.free = !!service.free;
            if (service.free)
                items.forEach((item) => { item.amount = 0; });
            receiptData.status = receiptData.dateStamp ? 'SELADO' : 'PROTOCOLADO';
            const orderCertificate = await OrderCertificate_1.default.query({ client: trx })
                .where('companies_id', authenticate.companies_id)
                .where('id', receiptData.orderCertificateId).forUpdate().firstOrFail();
            if (orderCertificate.inactive) {
                throw new BadRequestException_1.default('Formulário inativo não permite novo recibo.', 409, 'order_certificate_inactive');
            }
            const activeReceipt = await Receipt_1.default.query({ client: trx })
                .where('companies_id', authenticate.companies_id)
                .where('order_certificate_id', receiptData.orderCertificateId)
                .where((q) => q.whereNull('status').orWhereNot('status', 'EXCLUIDO')).first();
            if (activeReceipt) {
                throw new BadRequestException_1.default('Já existe um recibo ativo para esta certidão.', 409, 'active_receipt_exists');
            }
            const initialVerification = await EmployeeVerification_1.default.query({ client: trx })
                .where('companiesId', authenticate.companies_id)
                .where('local', 'receipt')
                .where('ordem', 1)
                .where('inactive', false)
                .first();
            if (!initialVerification) {
                throw new BadRequestException_1.default('Configure uma conferência ativa de ordem 1 para recibos.', 422, 'receipt_initial_verification_missing');
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
                employeeVerificationId: initialVerification.id,
                userId: authenticate.id,
                date: luxon_1.DateTime.local(),
                item: 1,
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
                .forUpdate()
                .firstOrFail();
            if (receipt.status === 'CANCELADO' || receipt.status === 'EXCLUIDO') {
                await trx.rollback();
                return response.status(400).send({
                    message: 'Recibo cancelado não pode ser alterado.',
                });
            }
            const payload = await request.validate(ReceiptValidator_1.default);
            console.log(payload);
            const { items, ...receiptData } = payload;
            if (receiptData.orderCertificateId !== receipt.orderCertificateId) {
                throw new BadRequestException_1.default('A certidão do recibo não pode ser alterada.', 409, 'receipt_order_change');
            }
            if (receiptData.status === 'CANCELADO' || receiptData.status === 'EXCLUIDO') {
                throw new BadRequestException_1.default('Use a ação de cancelamento do recibo.', 409, 'receipt_cancel_action_required');
            }
            const service = await Service_1.default.query({ client: trx })
                .where('companies_id', authenticate.companies_id).where('id', receiptData.serviceId).firstOrFail();
            receiptData.free = receipt.financialFinalizedAt ? receipt.free : !!service.free;
            if (receiptData.free)
                items?.forEach((item) => { item.amount = 0; });
            if (receipt.financialFinalizedAt) {
                if (receiptData.serviceId !== receipt.serviceId || receiptData.status === 'CANCELADO') {
                    await trx.rollback();
                    return response.status(409).send({ message: 'Serviço e cobrança não podem ser alterados após a finalização.' });
                }
                if (items) {
                    const savedItems = await ReceiptItem_1.default.query({ client: trx }).where('receipt_id', receipt.id);
                    const normalize = (list) => list.map((item) => [
                        Number(item.emolumentId), Number(item.qtde ?? 1), Math.round(Number(item.amount ?? 0) * 100),
                    ]).sort((a, b) => a[0] - b[0]);
                    const original = savedItems.map((item) => ({ emolumentId: item.emolumentId, qtde: item.qtde, amount: item.amount }));
                    if (JSON.stringify(normalize(items)) !== JSON.stringify(normalize(original))) {
                        await trx.rollback();
                        return response.status(409).send({ message: 'Os valores do recibo não podem ser alterados após a finalização.' });
                    }
                }
            }
            if (receipt.status !== 'REABERTO') {
                if (receiptData.dateStamp) {
                    receiptData.status = 'SELADO';
                }
                else {
                    receiptData.status = 'PROTOCOLADO';
                }
            }
            else if (receipt.status === 'REABERTO') {
                receiptData.status = 'REABERTO';
            }
            receipt.merge({
                ...receiptData,
                companiesId: authenticate.companies_id,
                userId: authenticate.id,
            });
            await receipt.save();
            if (items && !receipt.financialFinalizedAt) {
                await this.validateEmolumentsInPivot({
                    trx,
                    companiesId: authenticate.companies_id,
                    serviceId: receipt.serviceId,
                    items: items,
                });
                await ReceiptItem_1.default.query({ client: trx }).where('receipt_id', receipt.id).delete();
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
    async cancelActivePayments(receipt, trx) {
        await ReceiptPayment_1.default.query({ client: trx })
            .where('receipt_id', receipt.id).whereNull('canceled_at')
            .update({ canceled_at: luxon_1.DateTime.local().toFormat('yyyy-LL-dd HH:mm:ss') });
        receipt.financialFinalizedAt = null;
    }
    async checkInvoice(receipt, trx) {
        const invoice = await SpedyServiceInvoice_1.default.query({ client: trx })
            .where('companies_id', receipt.companiesId).where('receipt_id', receipt.id).first();
        if (invoice) {
            throw new BadRequestException_1.default('Há uma NF vinculada a este recibo. O cancelamento com NF será tratado em uma próxima etapa.', 409, 'receipt_invoice_exists');
        }
    }
    async cancelPayments({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const trx = await Database_1.default.transaction();
        try {
            const receipt = await Receipt_1.default.query({ client: trx })
                .where('companies_id', authenticate.companies_id)
                .where('id', params.id).forUpdate().firstOrFail();
            if (receipt.status === 'EXCLUIDO' || receipt.status === 'CANCELADO') {
                throw new BadRequestException_1.default('Recibo cancelado não pode ser reaberto.', 409, 'receipt_cancelled');
            }
            if (!receipt.financialFinalizedAt || receipt.free) {
                throw new BadRequestException_1.default('Este recibo não possui recebimento ativo.', 409, 'receipt_not_received');
            }
            await this.checkInvoice(receipt, trx);
            await this.cancelActivePayments(receipt, trx);
            receipt.status = 'REABERTO';
            await receipt.save();
            await trx.commit();
            return response.ok(receipt);
        }
        catch (error) {
            await trx.rollback();
            throw error;
        }
    }
    async destroy({ auth, request, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const { username, password } = await request.validate({ schema: Validator_1.schema.create({
                username: Validator_1.schema.string({ trim: true }, [Validator_1.rules.maxLength(45)]),
                password: Validator_1.schema.string(),
            }) });
        const authorizer = await User_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .where('username', username).where('status', true).first();
        if (!authorizer || !await Hash_1.default.verify(authorizer.password, password)) {
            throw new BadRequestException_1.default('Usuário ou senha inválidos.', 403, 'receipt_cancel_invalid_credentials');
        }
        if (!authorizer.superuser) {
            const permission = await Groupxpermission_1.default.query()
                .where('usergroup_id', authorizer.usergroup_id)
                .where('permissiongroup_id', CANCEL_RECEIPT_PERMISSION_ID)
                .where((q) => q.whereNull('companies_id').orWhere('companies_id', authenticate.companies_id))
                .first();
            if (!permission) {
                throw new BadRequestException_1.default('Usuário sem permissão para cancelar recibos.', 403, 'receipt_cancel_forbidden');
            }
        }
        const trx = await Database_1.default.transaction();
        try {
            const receipt = await Receipt_1.default.query({ client: trx })
                .where('companies_id', authenticate.companies_id)
                .where('id', params.id).forUpdate().firstOrFail();
            if (receipt.status === 'EXCLUIDO') {
                throw new BadRequestException_1.default('Recibo já excluído.', 409, 'receipt_already_excluded');
            }
            await this.checkInvoice(receipt, trx);
            const previousStatus = receipt.status;
            const previousFinalizedAt = receipt.financialFinalizedAt;
            await this.cancelActivePayments(receipt, trx);
            receipt.status = 'EXCLUIDO';
            await receipt.save();
            const now = luxon_1.DateTime.local();
            await AuditLog_1.default.create({
                companiesId: authenticate.companies_id,
                userId: authorizer.id,
                action: 'receipt_cancel',
                entityTable: 'receipts',
                entityId: receipt.id,
                resourceKey: `receipts:${receipt.id}`,
                description: `Usuário ${authorizer.name || authorizer.username} autorizou o cancelamento do recibo ${receipt.id}, solicitado por ${authenticate.name || authenticate.username}.`,
                metadata: {
                    authorizedByUserId: authorizer.id,
                    requestedByUserId: authenticate.id,
                    requestedByUsername: authenticate.username,
                    orderCertificateId: receipt.orderCertificateId,
                },
                changedFields: ['status', 'financialFinalizedAt'],
                beforeData: { status: previousStatus, financialFinalizedAt: previousFinalizedAt?.toISO() ?? null },
                afterData: { status: receipt.status, financialFinalizedAt: null },
                occurrenceCount: 1,
                firstAt: now,
                lastAt: now,
                ip: request.ip(),
            }, { client: trx });
            await trx.commit();
            return response.ok(receipt);
        }
        catch (error) {
            await trx.rollback();
            throw error;
        }
    }
}
exports.default = ReceiptsController;
//# sourceMappingURL=ReceiptsController.js.map