"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const EmployeeVerification_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/EmployeeVerification"));
const EmployeeVerificationXReceipt_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/EmployeeVerificationXReceipt"));
const Receipt_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Receipt"));
const EmployeeVerificationXReceiptValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/EmployeeVerificationXReceiptValidator"));
class EmployeeVerificationXReceiptsController {
    async index({ auth, request }) {
        const authenticate = await auth.use('api').authenticate();
        const companiesId = authenticate.companies_id;
        const { receipt_id, employee_verification_id } = request.qs();
        const query = EmployeeVerificationXReceipt_1.default.query()
            .where('companiesId', companiesId);
        if (receipt_id) {
            query.where('receiptId', Number(receipt_id));
        }
        if (employee_verification_id) {
            query.where('employeeVerificationId', Number(employee_verification_id));
        }
        query
            .preload('receipt')
            .preload('employeeVerification')
            .preload('company')
            .preload('user')
            .orderBy('item', 'asc');
        const items = await query;
        return items;
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const companiesId = authenticate.companies_id;
        const userId = authenticate.id;
        const payload = await request.validate({
            schema: EmployeeVerificationXReceiptValidator_1.default.createSchema,
            messages: EmployeeVerificationXReceiptValidator_1.default.messages,
        });
        const verification = await EmployeeVerification_1.default.query()
            .where('id', payload.employeeVerificationId)
            .where('companiesId', companiesId)
            .where('local', 'receipt')
            .where('inactive', false)
            .first();
        if (!verification) {
            return response.status(422).json({
                message: 'A conferência de funcionário informada não está disponível para recibos nesta empresa',
            });
        }
        const item = await Database_1.default.transaction(async (trx) => {
            await Receipt_1.default.query({ client: trx })
                .where('id', payload.receiptId)
                .where('companiesId', companiesId)
                .forUpdate()
                .firstOrFail();
            const alreadyExists = await EmployeeVerificationXReceipt_1.default.query({ client: trx })
                .where('receiptId', payload.receiptId)
                .where('employeeVerificationId', payload.employeeVerificationId)
                .first();
            if (alreadyExists)
                return null;
            const last = await EmployeeVerificationXReceipt_1.default.query({ client: trx })
                .where('receiptId', payload.receiptId)
                .orderBy('item', 'desc')
                .preload('employeeVerification')
                .first();
            if (last && last.employeeVerification?.ordem == null)
                return false;
            if (verification.ordem !== (last?.employeeVerification?.ordem ?? 0) + 1)
                return false;
            return EmployeeVerificationXReceipt_1.default.create({
                receiptId: payload.receiptId,
                companiesId,
                employeeVerificationId: payload.employeeVerificationId,
                userId,
                date: payload.date,
                item: (last?.item || 0) + 1,
            }, { client: trx });
        });
        if (item === false) {
            return response.status(422).json({ message: 'Selecione a próxima conferência na ordem do recibo' });
        }
        if (!item) {
            return response.status(409).json({
                message: 'Já existe um vínculo para este recibo e conferência de funcionário nesta empresa',
            });
        }
        return item;
    }
    async show({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const companiesId = authenticate.companies_id;
        const item = await EmployeeVerificationXReceipt_1.default.query()
            .where('id', params.id)
            .where('companiesId', companiesId)
            .preload('receipt')
            .preload('employeeVerification')
            .preload('company')
            .preload('user')
            .first();
        if (!item) {
            return response.status(404).json({
                message: 'Registro não encontrado',
            });
        }
        return item;
    }
    async update({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const companiesId = authenticate.companies_id;
        const item = await EmployeeVerificationXReceipt_1.default.query()
            .where('id', params.id)
            .where('companiesId', companiesId)
            .first();
        if (!item) {
            return response.status(404).json({
                message: 'Registro não encontrado',
            });
        }
        const payload = await request.validate({
            schema: EmployeeVerificationXReceiptValidator_1.default.updateSchema,
            messages: EmployeeVerificationXReceiptValidator_1.default.messages,
        });
        if (payload.employeeVerificationId !== undefined) {
            const verification = await EmployeeVerification_1.default.query()
                .where('id', payload.employeeVerificationId)
                .where('companiesId', companiesId)
                .where('local', 'receipt')
                .where('inactive', false)
                .first();
            if (!verification) {
                return response.status(422).json({
                    message: 'A conferência de funcionário informada não está disponível para recibos nesta empresa',
                });
            }
        }
        const updated = await Database_1.default.transaction(async (trx) => {
            const destinationReceiptId = payload.receiptId ?? item.receiptId;
            const receiptIds = [...new Set([item.receiptId, destinationReceiptId])].sort((a, b) => a - b);
            for (const receiptId of receiptIds) {
                await Receipt_1.default.query({ client: trx })
                    .where('id', receiptId)
                    .where('companiesId', companiesId)
                    .forUpdate()
                    .firstOrFail();
            }
            const current = await EmployeeVerificationXReceipt_1.default.query({ client: trx })
                .where('id', item.id)
                .where('companiesId', companiesId)
                .first();
            if (!current)
                return null;
            if (current.receiptId !== item.receiptId)
                return false;
            const oldReceiptId = current.receiptId;
            const oldItem = current.item;
            if (destinationReceiptId !== oldReceiptId) {
                const last = await EmployeeVerificationXReceipt_1.default.query({ client: trx })
                    .where('receiptId', destinationReceiptId)
                    .orderBy('item', 'desc')
                    .first();
                current.receiptId = destinationReceiptId;
                current.item = (last?.item || 0) + 1;
            }
            if (payload.employeeVerificationId !== undefined) {
                current.employeeVerificationId = payload.employeeVerificationId;
            }
            if (payload.date !== undefined) {
                current.date = payload.date;
            }
            await current.save();
            if (destinationReceiptId !== oldReceiptId) {
                const following = await EmployeeVerificationXReceipt_1.default.query({ client: trx })
                    .where('receiptId', oldReceiptId)
                    .where('item', '>', oldItem)
                    .orderBy('item', 'asc');
                for (const entry of following) {
                    entry.item -= 1;
                    await entry.save();
                }
            }
            return current;
        });
        if (updated === false) {
            return response.status(409).json({ message: 'O vínculo mudou de recibo. Atualize e tente novamente.' });
        }
        if (!updated) {
            return response.status(404).json({ message: 'Registro não encontrado' });
        }
        return updated;
    }
    async destroy({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const companiesId = authenticate.companies_id;
        const item = await EmployeeVerificationXReceipt_1.default.query()
            .where('id', params.id)
            .where('companiesId', companiesId)
            .first();
        if (!item) {
            return response.status(404).json({
                message: 'Registro não encontrado',
            });
        }
        const deleted = await Database_1.default.transaction(async (trx) => {
            await Receipt_1.default.query({ client: trx })
                .where('id', item.receiptId)
                .where('companiesId', companiesId)
                .forUpdate()
                .firstOrFail();
            const current = await EmployeeVerificationXReceipt_1.default.query({ client: trx })
                .where('id', item.id)
                .where('companiesId', companiesId)
                .first();
            if (!current)
                return;
            if (current.receiptId !== item.receiptId)
                return false;
            const last = await EmployeeVerificationXReceipt_1.default.query({ client: trx })
                .where('receiptId', current.receiptId)
                .orderBy('item', 'desc')
                .orderBy('id', 'desc')
                .first();
            if (!last || last.id !== current.id)
                return false;
            await current.delete();
            const following = await EmployeeVerificationXReceipt_1.default.query({ client: trx })
                .where('receiptId', current.receiptId)
                .where('item', '>', current.item)
                .orderBy('item', 'asc');
            for (const entry of following) {
                entry.item -= 1;
                await entry.save();
            }
        });
        if (deleted === false) {
            return response.status(409).json({ message: 'Somente a última conferência do recibo pode ser excluída' });
        }
        return response.status(204);
    }
}
exports.default = EmployeeVerificationXReceiptsController;
//# sourceMappingURL=EmployeeVerificationXReceiptsController.js.map