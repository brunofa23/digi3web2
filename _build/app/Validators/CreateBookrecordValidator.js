"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class CreateBookrecordValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            cod: Validator_1.schema.number([
                Validator_1.rules.range(1, 10000000000)
            ]),
            book: Validator_1.schema.number([
                Validator_1.rules.range(1, 10000000000)
            ]),
            sheet: Validator_1.schema.number.optional([
                Validator_1.rules.range(1, 10000000000)
            ]),
            side: Validator_1.schema.string.optional(),
            approximate_term: Validator_1.schema.number(),
            index: Validator_1.schema.number.optional([
                Validator_1.rules.range(1, 5)
            ]),
            obs: Validator_1.schema.string.optional([
                Validator_1.rules.maxLength(255)
            ]),
            letter: Validator_1.schema.string.optional(),
            year: Validator_1.schema.number.optional()
        });
        this.messages = {
            required: 'The {{field}} is required to create a new company',
        };
    }
}
exports.default = CreateBookrecordValidator;
//# sourceMappingURL=CreateBookrecordValidator.js.map