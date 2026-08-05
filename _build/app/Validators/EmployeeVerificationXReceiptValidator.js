"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class EmployeeVerificationXReceiptValidator {
    constructor(ctx) {
        this.ctx = ctx;
    }
}
exports.default = EmployeeVerificationXReceiptValidator;
EmployeeVerificationXReceiptValidator.createSchema = Validator_1.schema.create({
    receiptId: Validator_1.schema.number([
        Validator_1.rules.unsigned(),
        Validator_1.rules.exists({ table: 'receipts', column: 'id' }),
    ]),
    employeeVerificationId: Validator_1.schema.number([
        Validator_1.rules.unsigned(),
        Validator_1.rules.exists({ table: 'employee_verifications', column: 'id' }),
    ]),
    date: Validator_1.schema.date({
        format: 'yyyy-MM-dd HH:mm:ss',
    }),
});
EmployeeVerificationXReceiptValidator.updateSchema = Validator_1.schema.create({
    receiptId: Validator_1.schema.number.optional([
        Validator_1.rules.unsigned(),
        Validator_1.rules.exists({ table: 'receipts', column: 'id' }),
    ]),
    employeeVerificationId: Validator_1.schema.number.optional([
        Validator_1.rules.unsigned(),
        Validator_1.rules.exists({ table: 'employee_verifications', column: 'id' }),
    ]),
    date: Validator_1.schema.date.optional({
        format: 'yyyy-MM-dd HH:mm:ss',
    }),
});
EmployeeVerificationXReceiptValidator.messages = {
    'receiptId.required': 'O campo receiptId é obrigatório',
    'employeeVerificationId.required': 'O campo employeeVerificationId é obrigatório',
    'date.required': 'O campo date é obrigatório',
    'receiptId.exists': 'O recibo informado não foi encontrado',
    'employeeVerificationId.exists': 'A conferência de funcionário informada não foi encontrada',
};
//# sourceMappingURL=EmployeeVerificationXReceiptValidator.js.map