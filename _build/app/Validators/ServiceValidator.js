"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class ServiceValidator {
    constructor() {
        this.schema = Validator_1.schema.create({
            name: Validator_1.schema.string({ trim: true }, [
                Validator_1.rules.maxLength(150),
            ]),
            description: Validator_1.schema.string.optional({ trim: true }, [
                Validator_1.rules.maxLength(255),
            ]),
            free: Validator_1.schema.boolean.optional(),
            inactive: Validator_1.schema.boolean.optional(),
        });
        this.messages = {
            'name.required': 'Nome é obrigatório',
            'name.maxLength': 'Nome deve ter no máximo 50 caracteres',
            'description.maxLength': 'Descrição deve ter no máximo 255 caracteres',
            'inactive.boolean': 'Inactive deve ser booleano',
        };
    }
}
exports.default = ServiceValidator;
//# sourceMappingURL=ServiceValidator.js.map