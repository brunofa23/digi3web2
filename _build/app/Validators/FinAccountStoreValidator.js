"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class FinAccountStoreValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            companies_id: Validator_1.schema.number.optional(),
            fin_emp_id: Validator_1.schema.number(),
            fin_class_id: Validator_1.schema.number(),
            fin_paymentmethod_id: Validator_1.schema.number(),
            id_replication: Validator_1.schema.number.optional(),
            description: Validator_1.schema.string.optional(),
            amount: Validator_1.schema.number.nullableAndOptional(),
            amount_paid: Validator_1.schema.number.nullableAndOptional(),
            date: Validator_1.schema.date.nullableAndOptional(),
            date_due: Validator_1.schema.date.nullableAndOptional(),
            replicate: Validator_1.schema.boolean.nullableAndOptional(),
            data_billing: Validator_1.schema.date.nullableAndOptional(),
            date_conciliation: Validator_1.schema.date.nullableAndOptional(),
            excluded: Validator_1.schema.boolean.nullableAndOptional(),
            debit_credit: Validator_1.schema.string.nullableAndOptional(),
            cost: Validator_1.schema.string.nullableAndOptional(),
            ir: Validator_1.schema.boolean.nullableAndOptional(),
            obs: Validator_1.schema.string.nullableAndOptional(),
            conciliation: Validator_1.schema.boolean.optional(),
        });
        this.messages = {};
    }
}
exports.default = FinAccountStoreValidator;
//# sourceMappingURL=FinAccountStoreValidator.js.map