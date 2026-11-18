"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'order_certificate_averbations';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('book_number').unsigned().nullable().alter();
            table.integer('sheet_number').unsigned().nullable().alter();
            table.integer('term_number').unsigned().nullable().alter();
            table.integer('averbation_description_id').unsigned().nullable().alter();
            table.integer('document_type_book_id').unsigned().nullable().alter();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('book_number').unsigned().notNullable().alter();
            table.integer('sheet_number').unsigned().notNullable().alter();
            table.integer('term_number').unsigned().notNullable().alter();
            table.integer('averbation_description_id').unsigned().notNullable().alter();
            table.integer('document_type_book_id').unsigned().notNullable().alter();
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1794900000000_order_certificate_averbations_fields_nullable.js.map