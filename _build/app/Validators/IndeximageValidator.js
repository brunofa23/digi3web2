"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class IndeximageValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            bookrecords_id: Validator_1.schema.number.optional(),
            typebooks_id: Validator_1.schema.number.optional(),
            companies_id: Validator_1.schema.number.optional(),
            seq: Validator_1.schema.number.optional(),
            ext: Validator_1.schema.string.optional({ trim: true }),
            file_name: Validator_1.schema.string.optional({ trim: true }),
            drive_file_id: Validator_1.schema.string.nullableAndOptional({ trim: true }),
            drive_file_size: Validator_1.schema.number.nullableAndOptional(),
            drive_md5_checksum: Validator_1.schema.string.nullableAndOptional({ trim: true }),
            drive_folder_id: Validator_1.schema.string.nullableAndOptional({ trim: true }),
            previous_file_name: Validator_1.schema.string.nullableAndOptional({ trim: true }),
            book: Validator_1.schema.number.nullableAndOptional(),
            sheet: Validator_1.schema.number.nullableAndOptional(),
            register: Validator_1.schema.number.nullableAndOptional(),
            ready: Validator_1.schema.boolean.optional(),
            date_atualization: Validator_1.schema.date.nullableAndOptional(),
        });
    }
}
exports.default = IndeximageValidator;
//# sourceMappingURL=IndeximageValidator.js.map