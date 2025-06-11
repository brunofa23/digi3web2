"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class FinAccountUpdateValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            companies_id: Validator_1.schema.number.optional(),
            fin_emp_id: Validator_1.schema.number.optional(),
            fin_class_id: Validator_1.schema.number.optional(),
            fin_paymentmethod_id: Validator_1.schema.number.optional(),
            id_replication: Validator_1.schema.number.optional(),
            description: Validator_1.schema.string.optional(),
            amount: Validator_1.schema.string.optional(),
            date: Validator_1.schema.date.optional(),
            date_due: Validator_1.schema.date.optional(),
            replicate: Validator_1.schema.boolean.optional(),
            data_billing: Validator_1.schema.date.optional(),
            date_conciliation: Validator_1.schema.date.optional(),
            excluded: Validator_1.schema.boolean.optional(),
            debit_credit: Validator_1.schema.string.optional(),
            cost: Validator_1.schema.string.optional(),
            ir: Validator_1.schema.boolean.optional(),
            obs: Validator_1.schema.string.optional(),
            analyze: Validator_1.schema.boolean.nullableAndOptional(),
            future: Validator_1.schema.boolean.nullableAndOptional(),
            reserve: Validator_1.schema.boolean.nullableAndOptional(),
            overplus: Validator_1.schema.boolean.nullableAndOptional(),
            limit_amount: Validator_1.schema.string.nullableAndOptional(),
            conciliation: Validator_1.schema.boolean.optional(),
        });
        this.messages = {};
    }
}
exports.default = FinAccountUpdateValidator;
//# sourceMappingURL=FinAccountUpdateValidator.js.map