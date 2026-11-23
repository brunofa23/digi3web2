"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class SalesOpportunityEmailValidator {
    constructor() {
        this.schema = Validator_1.schema.create({
            subject: Validator_1.schema.string({ trim: true }, [Validator_1.rules.maxLength(255)]),
            description: Validator_1.schema.string({ trim: true }),
            activity_date: Validator_1.schema.date(),
            assigned_user_id: Validator_1.schema.number.nullableAndOptional(),
            next_action: Validator_1.schema.string.nullableAndOptional({ trim: true }),
            next_contact_date: Validator_1.schema.date.nullableAndOptional(),
        });
    }
}
exports.default = SalesOpportunityEmailValidator;
//# sourceMappingURL=SalesOpportunityEmailValidator.js.map