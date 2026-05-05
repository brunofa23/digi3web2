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
            table.integer('document_type_book_id').nullable().unsigned()
                .after('documenttype_id').references('document_type_books.id')
                .onDelete('CASCADE').onUpdate('CASCADE');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('document_type_book_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1760637069036_document_add_document_type_book_ids.js.map