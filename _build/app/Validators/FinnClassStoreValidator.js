"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class FinnClassStoreValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            companies_id: Validator_1.schema.number.optional(),
            description: Validator_1.schema.string(),
            excluded: Validator_1.schema.boolean.nullableAndOptional(),
            inactive: Validator_1.schema.boolean.nullableAndOptional(),
            debit_credit: Validator_1.schema.string(),
            cost: Validator_1.schema.string.nullableAndOptional(),
            allocation: Validator_1.schema.string.nullableAndOptional(),
            limit_amount: Validator_1.schema.number.nullableAndOptional()
        });
        this.messages = {};
    }
}
exports.default = FinnClassStoreValidator;
//# sourceMappingURL=FinnClassStoreValidator.js.map