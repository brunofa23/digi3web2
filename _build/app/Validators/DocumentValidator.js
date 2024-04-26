"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class DocumentValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            bookrecords_id: Validator_1.schema.number.nullableAndOptional(),
            box: Validator_1.schema.number.nullableAndOptional(),
            prot: Validator_1.schema.number.nullableAndOptional(),
            month: Validator_1.schema.number.nullableAndOptional([Validator_1.rules.range(1, 12)]),
            yeardoc: Validator_1.schema.number.nullableAndOptional(),
            intfield1: Validator_1.schema.number.nullableAndOptional(),
            stringfield1: Validator_1.schema.string.nullableAndOptional(),
            datefield1: Validator_1.schema.date.nullableAndOptional(),
            intfield2: Validator_1.schema.number.nullableAndOptional(),
            stringfield2: Validator_1.schema.string.nullableAndOptional(),
            datefield2: Validator_1.schema.date.nullableAndOptional(),
            intfield3: Validator_1.schema.number.nullableAndOptional(),
            stringfield3: Validator_1.schema.string.nullableAndOptional(),
            datefield3: Validator_1.schema.date.nullableAndOptional(),
            intfield4: Validator_1.schema.number.nullableAndOptional(),
            stringfield4: Validator_1.schema.string.nullableAndOptional(),
            datefield4: Validator_1.schema.date.nullableAndOptional(),
            intfield5: Validator_1.schema.number.nullableAndOptional(),
            stringfield5: Validator_1.schema.string.nullableAndOptional(),
            datefield5: Validator_1.schema.date.nullableAndOptional(),
            intfield6: Validator_1.schema.number.nullableAndOptional(),
            stringfield6: Validator_1.schema.string.nullableAndOptional(),
            datefield6: Validator_1.schema.date.nullableAndOptional(),
            intfield7: Validator_1.schema.number.nullableAndOptional(),
            stringfield7: Validator_1.schema.string.nullableAndOptional(),
            datefield7: Validator_1.schema.date.nullableAndOptional(),
            intfield8: Validator_1.schema.number.nullableAndOptional(),
            stringfield8: Validator_1.schema.string.nullableAndOptional(),
            datefield8: Validator_1.schema.date.nullableAndOptional(),
            intfield9: Validator_1.schema.number.nullableAndOptional(),
            stringfield9: Validator_1.schema.string.nullableAndOptional(),
            datefield9: Validator_1.schema.date.nullableAndOptional(),
            intfield10: Validator_1.schema.number.nullableAndOptional(),
            stringfield10: Validator_1.schema.string.nullableAndOptional(),
            datefield10: Validator_1.schema.date.nullableAndOptional(),
            intfield11: Validator_1.schema.number.nullableAndOptional(),
            stringfield11: Validator_1.schema.string.nullableAndOptional(),
            datefield11: Validator_1.schema.date.nullableAndOptional(),
            intfield12: Validator_1.schema.number.nullableAndOptional(),
            stringfield12: Validator_1.schema.string.nullableAndOptional(),
            datefield12: Validator_1.schema.date.nullableAndOptional(),
            intfield13: Validator_1.schema.number.nullableAndOptional(),
            stringfield13: Validator_1.schema.string.nullableAndOptional(),
            datefield13: Validator_1.schema.date.nullableAndOptional(),
        });
    }
}
exports.default = DocumentValidator;
//# sourceMappingURL=DocumentValidator.js.map