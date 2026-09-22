"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class SpedyServiceInvoiceDefaultsValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            description: Validator_1.schema.string.nullableAndOptional({ trim: true }),
            sendEmailToCustomer: Validator_1.schema.boolean.optional(),
            cnaeCode: Validator_1.schema.string.nullableAndOptional({ trim: true }),
            federalServiceCode: Validator_1.schema.string.nullableAndOptional({ trim: true }, [Validator_1.rules.maxLength(20)]),
            cityServiceCode: Validator_1.schema.string.nullableAndOptional({ trim: true }, [Validator_1.rules.maxLength(40)]),
            nbsCode: Validator_1.schema.string.nullableAndOptional({ trim: true }, [Validator_1.rules.maxLength(20)]),
            taxationType: Validator_1.schema.string.nullableAndOptional({ trim: true }, [Validator_1.rules.maxLength(60)]),
            taxLocation: Validator_1.schema.string.nullableAndOptional({ trim: true }, [Validator_1.rules.maxLength(60)]),
            issRate: Validator_1.schema.number.nullableAndOptional(),
        });
        this.messages = {
            required: 'O campo {{ field }} é obrigatório',
        };
    }
}
exports.default = SpedyServiceInvoiceDefaultsValidator;
//# sourceMappingURL=SpedyServiceInvoiceDefaultsValidator.js.map