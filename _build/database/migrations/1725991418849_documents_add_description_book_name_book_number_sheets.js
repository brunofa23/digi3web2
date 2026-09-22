"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'documents';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('documenttype_id').nullable().unsigned().references('documenttypes.id').onDelete('CASCADE').onUpdate('CASCADE');
            table.boolean('free').nullable();
            table.string('book_name').nullable();
            table.integer('book_number').nullable();
            table.integer('sheet_number').nullable();
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
//# sourceMappingURL=1725991418849_documents_add_description_book_name_book_number_sheets.js.map