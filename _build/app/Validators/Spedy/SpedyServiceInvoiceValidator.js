"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class SpedyServiceInvoiceValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            integrationId: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(36)]),
            effectiveDate: Validator_1.schema.date.optional(),
            description: Validator_1.schema.string({ trim: true }),
            amount: Validator_1.schema.number(),
            sendEmailToCustomer: Validator_1.schema.boolean.optional(),
            cnaeCode: Validator_1.schema.string.nullableAndOptional({ trim: true }),
            federalServiceCode: Validator_1.schema.string.nullableAndOptional({ trim: true }),
            cityServiceCode: Validator_1.schema.string.nullableAndOptional({ trim: true }),
            nbsCode: Validator_1.schema.string.nullableAndOptional({ trim: true }),
            taxationType: Validator_1.schema.string.nullableAndOptional({ trim: true }),
            taxLocation: Validator_1.schema.string.nullableAndOptional({ trim: true }),
            issRate: Validator_1.schema.number.nullableAndOptional(),
            receiver: Validator_1.schema.object.optional().members({
                name: Validator_1.schema.string.nullableAndOptional({ trim: true }),
                federalTaxNumber: Validator_1.schema.string.nullableAndOptional({ trim: true }),
                cityTaxNumber: Validator_1.schema.string.nullableAndOptional({ trim: true }),
                email: Validator_1.schema.string.nullableAndOptional({ trim: true }, [Validator_1.rules.email()]),
                phoneNumber: Validator_1.schema.string.nullableAndOptional({ trim: true }),
                address: Validator_1.schema.object.nullableAndOptional().members({
                    street: Validator_1.schema.string.nullableAndOptional({ trim: true }),
                    number: Validator_1.schema.string.nullableAndOptional({ trim: true }),
                    district: Validator_1.schema.string.nullableAndOptional({ trim: true }),
                    postalCode: Validator_1.schema.string.nullableAndOptional({ trim: true }),
                    additionalInformation: Validator_1.schema.string.nullableAndOptional({ trim: true }),
                    city: Validator_1.schema.object.optional().members({
                        code: Validator_1.schema.number.nullableAndOptional(),
                        name: Validator_1.schema.string.nullableAndOptional({ trim: true }),
                        state: Validator_1.schema.string.nullableAndOptional({ trim: true }, [Validator_1.rules.maxLength(2)]),
                    }),
                }),
            }),
            location: Validator_1.schema.object.optional().members({
                code: Validator_1.schema.number.nullableAndOptional(),
                name: Validator_1.schema.string.nullableAndOptional({ trim: true }),
                state: Validator_1.schema.string.nullableAndOptional({ trim: true }, [Validator_1.rules.maxLength(2)]),
            }),
        });
        this.messages = {
            required: 'O campo {{ field }} é obrigatório',
        };
    }
}
exports.default = SpedyServiceInvoiceValidator;
//# sourceMappingURL=SpedyServiceInvoiceValidator.js.map