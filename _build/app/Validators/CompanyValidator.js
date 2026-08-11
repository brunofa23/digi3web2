"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class CompanyValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            name: Validator_1.schema.string({}, [Validator_1.rules.maxLength(50), Validator_1.rules.minLength(5),]),
            shortname: Validator_1.schema.string({}, [Validator_1.rules.maxLength(45)]),
            address: Validator_1.schema.string.optional({}, [Validator_1.rules.maxLength(70)]),
            number: Validator_1.schema.string.optional(),
            complement: Validator_1.schema.string.optional(),
            postalcode: Validator_1.schema.string.optional(),
            district: Validator_1.schema.string.optional(),
            city: Validator_1.schema.string.optional(),
            state: Validator_1.schema.string.optional({}, [Validator_1.rules.maxLength(2)]),
            cnpj: Validator_1.schema.string.optional({}, [Validator_1.rules.maxLength(14), Validator_1.rules.minLength(14),]),
            responsablename: Validator_1.schema.string.optional(),
            phoneresponsable: Validator_1.schema.string.optional(),
            email: Validator_1.schema.string.optional({}, [Validator_1.rules.email(),]),
            status: Validator_1.schema.boolean(),
            cloud: Validator_1.schema.number(),
            use_device_control: Validator_1.schema.boolean.optional(),
            use_device_cookie_control: Validator_1.schema.boolean.optional(),
            module_books: Validator_1.schema.boolean.optional(),
            module_financial: Validator_1.schema.boolean.optional(),
            module_lgpd: Validator_1.schema.boolean.optional(),
            obs: Validator_1.schema.string.nullableAndOptional({}, [Validator_1.rules.maxLength(255)]),
            licence_value: Validator_1.schema.number.nullableAndOptional(),
            due_date: Validator_1.schema.string.nullableAndOptional({}, [Validator_1.rules.maxLength(10)]),
            fin_entity_id: Validator_1.schema.number.nullableAndOptional(),
            situation_ids: Validator_1.schema.array.optional().members(Validator_1.schema.number([
                Validator_1.rules.exists({ table: 'situation', column: 'id' }),
            ]))
        });
        this.messages = {
            required: 'The {{field}} is required to create a new company',
            'shortname.unique': 'Username not available',
            'email.email': "email inválido"
        };
    }
}
exports.default = CompanyValidator;
//# sourceMappingURL=CompanyValidator.js.map