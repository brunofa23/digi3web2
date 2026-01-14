"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class PersonValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            name: this.isCreate
                ? Validator_1.schema.string({ trim: true }, [Validator_1.rules.maxLength(90)])
                : Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(90)]),
            nameMarried: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(90)]),
            cpf: this.isCreate
                ? Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.regex(/^\d{11}$/)])
                : Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.regex(/^\d{11}$/)]),
            gender: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(1)]),
            deceased: Validator_1.schema.boolean.optional(),
            dateBirth: Validator_1.schema.date.optional({ format: 'yyyy-MM-dd' }),
            maritalStatus: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(15)]),
            illiterate: Validator_1.schema.boolean.optional(),
            mother: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(100)]),
            father: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(100)]),
            placeBirth: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(100)]),
            nationality: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(50)]),
            occupationId: Validator_1.schema.number.nullableAndOptional(),
            zipCode: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(15)]),
            address: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(150)]),
            streetNumber: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(5)]),
            streetComplement: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(10)]),
            district: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(100)]),
            city: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(100)]),
            state: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.regex(/^[A-Za-z]{2}$/)]),
            documentType: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(50)]),
            documentNumber: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(50)]),
            phone: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(15)]),
            cellphone: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(15)]),
            email: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.email(), Validator_1.rules.maxLength(90)]),
            inactive: Validator_1.schema.boolean.optional(),
        });
        this.messages = {
            'name.required': 'Nome é obrigatório.',
            'cpf.required': 'CPF é obrigatório.',
            'cpf.regex': 'CPF deve conter exatamente 11 dígitos numéricos.',
            'email.email': 'E-mail inválido.',
            'state.regex': 'UF deve conter 2 letras.',
        };
    }
    get isCreate() {
        const method = this.ctx.request.method().toUpperCase();
        return method === 'POST';
    }
}
exports.default = PersonValidator;
//# sourceMappingURL=PersonValidator.js.map