"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class TypebookValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            id: Validator_1.schema.number.optional(),
            name: Validator_1.schema.string({}, [Validator_1.rules.maxLength(255)]),
            status: Validator_1.schema.boolean(),
            path: Validator_1.schema.string(),
            books_id: Validator_1.schema.number(),
            companies_id: Validator_1.schema.number()
        });
    }
}
exports.default = TypebookValidator;
//# sourceMappingURL=TypebookValidator.js.map