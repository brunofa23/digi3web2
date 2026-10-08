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
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('companies_id').unsigned().notNullable().references('id').inTable('companies').onDelete('RESTRICT');
            table.integer('order_certificate_id').unsigned().notNullable().references('id').inTable('order_certificates').onDelete('CASCADE');
            table.integer('book_number').unsigned().notNullable();
            table.integer('sheet_number').unsigned().notNullable();
            table.integer('term_number').unsigned().notNullable();
            table.integer('averbation_description_id').unsigned().notNullable().references('id').inTable('averbation_descriptions').onDelete('RESTRICT');
            table.integer('document_type_book_id').unsigned().notNullable().references('id').inTable('document_type_books').onDelete('RESTRICT');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.index(['order_certificate_id', 'companies_id'], 'order_cert_averbations_order_company_idx');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1791420000000_order_certificate_averbations.js.map