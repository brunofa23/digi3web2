"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EmployeeVerificationXReceipt_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/EmployeeVerificationXReceipt"));
const EmployeeVerificationXReceiptValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/EmployeeVerificationXReceiptValidator"));
class EmployeeVerificationXReceiptsController {
    async index({ auth, request, response }) {
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
            .preload('user');
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
        const alreadyExists = await EmployeeVerificationXReceipt_1.default.query()
            .where('receiptId', payload.receiptId)
            .where('employeeVerificationId', payload.employeeVerificationId)
            .where('companiesId', companiesId)
            .first();
        if (alreadyExists) {
            return response.status(409).json({
                message: 'Já existe um vínculo para este recibo e conferência de funcionário nesta empresa',
            });
        }
        const item = await EmployeeVerificationXReceipt_1.default.create({
            receiptId: payload.receiptId,
            companiesId,
            employeeVerificationId: payload.employeeVerificationId,
            userId,
            date: payload.date,
        });
        await item.refresh();
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
        if (payload.receiptId !== undefined) {
            item.receiptId = payload.receiptId;
        }
        if (payload.employeeVerificationId !== undefined) {
            item.employeeVerificationId = payload.employeeVerificationId;
        }
        if (payload.date !== undefined) {
            item.date = payload.date;
        }
        await item.save();
        await item.refresh();
        return item;
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
        await item.delete();
        return response.status(204);
    }
}
exports.default = EmployeeVerificationXReceiptsController;
//# sourceMappingURL=EmployeeVerificationXReceiptsController.js.map