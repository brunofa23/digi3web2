"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class EmployeeVerificationValidator {
    constructor() {
        this.schema = Validator_1.schema.create({
            id: Validator_1.schema.number.optional([Validator_1.rules.unsigned()]),
            description: Validator_1.schema.string({ trim: true }, [
                Validator_1.rules.maxLength(80),
            ]),
            local: Validator_1.schema.enum(['receipt', 'certificate']),
            inactive: Validator_1.schema.boolean.optional(),
        });
        this.messages = {
            'description.required': 'Descrição é obrigatória',
            'description.maxLength': 'Descrição deve ter no máximo 80 caracteres',
            'local.required': 'Local é obrigatório',
            'local.enum': 'Local deve ser receipt ou certificate',
            'inactive.boolean': 'Inactive deve ser booleano',
        };
    }
}
exports.default = EmployeeVerificationValidator;
//# sourceMappingURL=EmployeeVerificationValidator.js.map