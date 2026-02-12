"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class EmolumentValidator {
    constructor() {
        this.schema = Validator_1.schema.create({
            name: Validator_1.schema.string({ trim: true }, [Validator_1.rules.maxLength(50)]),
            description: Validator_1.schema.string.optional({ trim: true }),
            price: Validator_1.schema.string.optional(),
            inactive: Validator_1.schema.boolean.optional(),
            code: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(10)]),
            type: Validator_1.schema.string({ trim: true }, [Validator_1.rules.maxLength(50)]),
        });
        this.messages = {
            'companiesId.required': 'Empresa é obrigatória',
            'companiesId.unsigned': 'Empresa inválida',
            'companiesId.exists': 'Empresa não encontrada',
            'name.required': 'Nome é obrigatório',
            'name.maxLength': 'Nome deve ter no máximo 50 caracteres',
            'price.number': 'Preço inválido',
            'price.range': 'Preço fora do intervalo permitido',
            'code.maxLength': 'Código deve ter no máximo 10 caracteres',
            'type.required': 'Tipo é obrigatório',
            'type.maxLength': 'Tipo deve ter no máximo 50 caracteres',
        };
    }
}
exports.default = EmolumentValidator;
//# sourceMappingURL=EmolumentValidator.js.map