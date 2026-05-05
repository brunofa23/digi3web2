"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class DocumentTypeBookValidator {
    constructor() {
        this.schema = Validator_1.schema.create({
            companies_id: Validator_1.schema.number.optional(),
            description: Validator_1.schema.string({}, [
                Validator_1.rules.required(),
                Validator_1.rules.maxLength(255),
            ]),
            inactive: Validator_1.schema.boolean.optional(),
        });
        this.messages = {
            'description.required': 'O campo descrição é obrigatório',
            'description.maxLength': 'A descrição deve ter no máximo 255 caracteres',
        };
    }
}
exports.default = DocumentTypeBookValidator;
//# sourceMappingURL=DocmentTypeBookValidator.js.map