"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class EmployeeVerificationXCertificateValidator {
    constructor(ctx) {
        this.ctx = ctx;
    }
}
exports.default = EmployeeVerificationXCertificateValidator;
EmployeeVerificationXCertificateValidator.createSchema = Validator_1.schema.create({
    marriedCertificateId: Validator_1.schema.number([
        Validator_1.rules.unsigned(),
        Validator_1.rules.exists({ table: 'married_certificates', column: 'id' }),
    ]),
    employeeVerificationId: Validator_1.schema.number([
        Validator_1.rules.unsigned(),
        Validator_1.rules.exists({ table: 'employee_verifications', column: 'id' }),
    ]),
    status: Validator_1.schema.string({ trim: true }, [
        Validator_1.rules.maxLength(80),
    ]),
    date: Validator_1.schema.date({
        format: 'yyyy-MM-dd HH:mm:ss',
    }),
});
EmployeeVerificationXCertificateValidator.updateSchema = Validator_1.schema.create({
    marriedCertificateId: Validator_1.schema.number.optional([
        Validator_1.rules.unsigned(),
        Validator_1.rules.exists({ table: 'married_certificates', column: 'id' }),
    ]),
    employeeVerificationId: Validator_1.schema.number.optional([
        Validator_1.rules.unsigned(),
        Validator_1.rules.exists({ table: 'employee_verifications', column: 'id' }),
    ]),
    status: Validator_1.schema.string.optional({ trim: true }, [
        Validator_1.rules.maxLength(80),
    ]),
    date: Validator_1.schema.date.optional({
        format: 'yyyy-MM-dd HH:mm:ss',
    }),
});
EmployeeVerificationXCertificateValidator.messages = {
    'marriedCertificateId.required': 'O campo marriedCertificateId é obrigatório',
    'employeeVerificationId.required': 'O campo employeeVerificationId é obrigatório',
    'status.required': 'O campo status é obrigatório',
    'date.required': 'O campo date é obrigatório',
    'marriedCertificateId.exists': 'O certificado de casamento informado não foi encontrado',
    'employeeVerificationId.exists': 'A conferência de funcionário informada não foi encontrada',
    'status.maxLength': 'Status deve ter no máximo 80 caracteres',
};
//# sourceMappingURL=EmployeeVerificationXCertificateValidator.js.map