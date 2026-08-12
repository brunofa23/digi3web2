"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class SpedyCompanyValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            name: Validator_1.schema.string({ trim: true }, [Validator_1.rules.maxLength(120)]),
            legalName: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(120)]),
            federalTaxNumber: Validator_1.schema.string({ trim: true }, [Validator_1.rules.maxLength(14)]),
            stateTaxNumber: Validator_1.schema.string.nullableAndOptional({ trim: true }, [Validator_1.rules.maxLength(30)]),
            cityTaxNumber: Validator_1.schema.string.nullableAndOptional({ trim: true }, [Validator_1.rules.maxLength(30)]),
            email: Validator_1.schema.string.nullableAndOptional({ trim: true }, [Validator_1.rules.email()]),
            phone: Validator_1.schema.string.nullableAndOptional({ trim: true }, [Validator_1.rules.maxLength(20)]),
            address: Validator_1.schema.object.optional().members({
                street: Validator_1.schema.string.optional({ trim: true }),
                number: Validator_1.schema.string.optional({ trim: true }),
                district: Validator_1.schema.string.optional({ trim: true }),
                postalCode: Validator_1.schema.string.optional({ trim: true }),
                additionalInformation: Validator_1.schema.string.nullableAndOptional({ trim: true }),
                city: Validator_1.schema.object.optional().members({
                    code: Validator_1.schema.string.nullableAndOptional({ trim: true }),
                    name: Validator_1.schema.string.nullableAndOptional({ trim: true }),
                    state: Validator_1.schema.string.nullableAndOptional({ trim: true }, [Validator_1.rules.maxLength(2)]),
                }),
            }),
            taxRegime: Validator_1.schema.enum.optional([
                'simplesNacional',
                'simplesNacionalExcessoSublimite',
                'simplesNacionalMEI',
                'regimeNormal',
            ]),
            simplesNacionalTaxRegime: Validator_1.schema.string.nullableAndOptional({ trim: true }, [Validator_1.rules.maxLength(80)]),
            specialTaxRegime: Validator_1.schema.string.nullableAndOptional({ trim: true }, [Validator_1.rules.maxLength(80)]),
            allowNaturalPersonCompany: Validator_1.schema.boolean.optional(),
            economicActivities: Validator_1.schema.array.optional().members(Validator_1.schema.object().members({
                code: Validator_1.schema.string({ trim: true }),
                isMain: Validator_1.schema.boolean.optional(),
            })),
        });
        this.messages = {
            required: 'O campo {{ field }} é obrigatório',
        };
    }
}
exports.default = SpedyCompanyValidator;
//# sourceMappingURL=SpedyCompanyValidator.js.map