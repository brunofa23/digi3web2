"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class CreateCompanyValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            name: Validator_1.schema.string({}, [
                Validator_1.rules.maxLength(50),
                Validator_1.rules.minLength(10),
            ]),
            shortname: Validator_1.schema.string({}, [Validator_1.rules.maxLength(45)]),
            address: Validator_1.schema.string({}, [
                Validator_1.rules.maxLength(70)
            ]),
            number: Validator_1.schema.string.optional(),
            complement: Validator_1.schema.string.optional(),
            cep: Validator_1.schema.string.optional({}, [
                Validator_1.rules.maxLength(8),
            ]),
            district: Validator_1.schema.string.optional(),
            city: Validator_1.schema.string.optional(),
            state: Validator_1.schema.string.optional({}, [
                Validator_1.rules.maxLength(2)
            ]),
            cnpj: Validator_1.schema.string.optional({}, [
                Validator_1.rules.maxLength(14),
                Validator_1.rules.minLength(14),
            ]),
            responsablename: Validator_1.schema.string.optional(),
            phoneresponsable: Validator_1.schema.string.optional(),
            email: Validator_1.schema.string.optional({}, [
                Validator_1.rules.email(),
            ]),
            status: Validator_1.schema.boolean()
        });
        this.messages = {
            required: 'The {{field}} is required to create a new company',
            'shortname.unique': 'Username not available',
            'email.email': "email inválido"
        };
    }
}
exports.default = CreateCompanyValidator;
//# sourceMappingURL=CreateCompanyValidator.js.map