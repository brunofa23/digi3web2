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
            table
                .integer('order_certificate_id')
                .unsigned()
                .nullable()
                .references('id')
                .inTable('order_certificates')
                .onUpdate('RESTRICT')
                .onDelete('SET NULL');
            table.unique(['order_certificate_id'], 'uq_documents_order_certificate_id');
            table.index(['companies_id', 'order_certificate_id'], 'idx_documents_company_order_certificate');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropUnique(['order_certificate_id'], 'uq_documents_order_certificate_id');
            table.dropIndex(['companies_id', 'order_certificate_id'], 'idx_documents_company_order_certificate');
            table.dropColumn('order_certificate_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1786700000000_documents_add_order_certificate_id.js.map