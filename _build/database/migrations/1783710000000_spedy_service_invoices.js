"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class SpedyServiceInvoices extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'spedy_service_invoices';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('companies_id').unsigned().notNullable().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('receipt_id').unsigned().nullable().references('id').inTable('receipts').onUpdate('RESTRICT').onDelete('SET NULL');
            table.string('environment', 20).notNullable().defaultTo('sandbox');
            table.uuid('spedy_company_id').nullable();
            table.uuid('spedy_invoice_id').nullable();
            table.string('integration_id', 36).notNullable();
            table.string('status', 40).nullable();
            table.string('number', 40).nullable();
            table.decimal('amount', 15, 2).notNullable().defaultTo(0);
            table.string('receiver_name', 120).nullable();
            table.string('receiver_federal_tax_number', 20).nullable();
            table.text('description').nullable();
            table.dateTime('effective_date').nullable();
            table.json('request_payload').nullable();
            table.json('response_payload').nullable();
            table.json('processing_detail').nullable();
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.unique(['companies_id', 'integration_id'], 'uniq_spedy_nfse_company_integration');
            table.index(['companies_id', 'status']);
            table.index(['spedy_invoice_id']);
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = SpedyServiceInvoices;
//# sourceMappingURL=1783710000000_spedy_service_invoices.js.map