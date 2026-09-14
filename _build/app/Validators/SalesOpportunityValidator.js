"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class SalesOpportunityValidator {
    constructor() {
        this.schema = Validator_1.schema.create({
            company_id: Validator_1.schema.number.nullableAndOptional([Validator_1.rules.exists({ table: 'companies', column: 'id' })]),
            sales_stage_id: Validator_1.schema.number([Validator_1.rules.exists({ table: 'sales_stages', column: 'id' })]),
            name: Validator_1.schema.string({ trim: true }, [Validator_1.rules.maxLength(120)]),
            city: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(100)]),
            contact_name: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(120)]),
            phone: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(30)]),
            interest: Validator_1.schema.string.optional({ trim: true }, [Validator_1.rules.maxLength(255)]),
            notes: Validator_1.schema.string.optional(),
            last_contact_date: Validator_1.schema.date.nullableAndOptional(),
            next_contact_date: Validator_1.schema.date.nullableAndOptional(),
            proposal_value: Validator_1.schema.number.nullableAndOptional(),
        });
    }
}
exports.default = SalesOpportunityValidator;
//# sourceMappingURL=SalesOpportunityValidator.js.map