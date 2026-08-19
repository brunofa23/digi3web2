"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'indeximage_ocr_entities';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('normalized_hash', 64).nullable().after('normalized_value');
            table.index(['companies_id', 'typebooks_id', 'entity_type', 'normalized_hash'], 'idx_img_ocr_entities_type_hash');
            table.index(['companies_id', 'typebooks_id', 'bookrecords_id', 'entity_type'], 'idx_img_ocr_entities_record_type');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropIndex(['companies_id', 'typebooks_id', 'entity_type', 'normalized_hash'], 'idx_img_ocr_entities_type_hash');
            table.dropIndex(['companies_id', 'typebooks_id', 'bookrecords_id', 'entity_type'], 'idx_img_ocr_entities_record_type');
            table.dropColumn('normalized_hash');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1786460000000_indeximage_ocr_entities_add_search_hash.js.map