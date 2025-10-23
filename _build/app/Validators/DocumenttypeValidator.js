"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class DocumenttypeValidator {
    constructor() {
        this.schema = Validator_1.schema.create({
            companies_id: Validator_1.schema.number.optional(),
            name: Validator_1.schema.string({}, [
                Validator_1.rules.required(),
                Validator_1.rules.maxLength(100),
            ]),
            description: Validator_1.schema.string.optional({}, [
                Validator_1.rules.maxLength(255),
            ]),
            status: Validator_1.schema.boolean.optional(),
        });
        this.messages = {
            'name.required': 'O campo nome é obrigatório',
            'name.maxLength': 'O nome deve ter no máximo 100 caracteres',
            'description.maxLength': 'A descrição deve ter no máximo 255 caracteres',
        };
    }
}
exports.default = DocumenttypeValidator;
//# sourceMappingURL=DocumenttypeValidator.js.map