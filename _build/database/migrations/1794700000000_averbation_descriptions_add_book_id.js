"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'averbation_descriptions';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('book_id').unsigned().nullable().references('id').inTable('books').onDelete('RESTRICT');
            table.index(['companies_id', 'book_id'], 'averbation_descriptions_company_book_idx');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropIndex(['companies_id', 'book_id'], 'averbation_descriptions_company_book_idx');
            table.dropColumn('book_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1794700000000_averbation_descriptions_add_book_id.js.map