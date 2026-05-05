"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class GenerateBookRecordValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            generateBooks_id: Validator_1.schema.number(),
            generateBook: Validator_1.schema.number(),
            generateBookdestination: Validator_1.schema.number.optional(),
            generateStartCode: Validator_1.schema.number(),
            generateEndCode: Validator_1.schema.number(),
            generateStartSheetInCodReference: Validator_1.schema.number.optional(),
            generateEndSheetInCodReference: Validator_1.schema.number.optional(),
            generateSheetIncrement: Validator_1.schema.number.optional(),
            generateSideStart: Validator_1.schema.string.optional(),
            generateAlternateOfSides: Validator_1.schema.string.optional(),
            generateApproximate_term: Validator_1.schema.number.optional(),
            generateApproximate_termIncrement: Validator_1.schema.number.optional(),
            generateIndex: Validator_1.schema.number(),
            generateIndexIncrement: Validator_1.schema.number.optional(),
            generateYear: Validator_1.schema.string.optional()
        });
    }
}
exports.default = GenerateBookRecordValidator;
//# sourceMappingURL=GenerateBookRecordValidator.js.map