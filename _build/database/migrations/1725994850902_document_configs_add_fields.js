"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'document_configs';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('documenttype_id').after('yeardoc');
            table.string('free').after('documenttype_id');
            table.string('book_name').after('free');
            table.string('book_number').after('book_name');
            table.string('sheet_number').after('book_number');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('documenttype_id');
            table.dropColumn('free');
            table.dropColumn('book_name');
            table.dropColumn('book_number');
            table.dropColumn('sheet_number');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1725994850902_document_configs_add_fields.js.map