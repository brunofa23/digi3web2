"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class CompanySpedyIntegrationValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            environment: Validator_1.schema.enum.optional(['sandbox', 'production']),
            spedyCompanyId: Validator_1.schema.string.nullableAndOptional({ trim: true }, [Validator_1.rules.maxLength(80)]),
            spedyApiKey: Validator_1.schema.string.nullableAndOptional({ trim: true }),
            isOwner: Validator_1.schema.boolean.optional(),
            active: Validator_1.schema.boolean.optional(),
            fetchCompany: Validator_1.schema.boolean.optional(),
        });
        this.messages = {
            required: 'O campo {{ field }} é obrigatório',
        };
    }
}
exports.default = CompanySpedyIntegrationValidator;
//# sourceMappingURL=CompanySpedyIntegrationValidator.js.map