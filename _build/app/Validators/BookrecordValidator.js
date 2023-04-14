"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class BookrecordValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            id: Validator_1.schema.number.optional(),
            typebooks_id: Validator_1.schema.number.optional(),
            books_id: Validator_1.schema.number.optional(),
            companies_id: Validator_1.schema.number.optional(),
            cod: Validator_1.schema.number(),
            book: Validator_1.schema.number([Validator_1.rules.range(1, 10000000000)]),
            sheet: Validator_1.schema.number.optional([Validator_1.rules.range(1, 10000000000)]),
            side: Validator_1.schema.string.optional(),
            approximate_term: Validator_1.schema.number(),
            indexbook: Validator_1.schema.number.optional([Validator_1.rules.range(1, 5)]),
            obs: Validator_1.schema.string.optional([Validator_1.rules.maxLength(255)]),
            letter: Validator_1.schema.string.optional(),
            year: Validator_1.schema.number.optional(),
            model: Validator_1.schema.string.optional()
        });
    }
}
exports.default = BookrecordValidator;
//# sourceMappingURL=BookrecordValidator.js.map