"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class SpedyServiceInvoiceFinAccount extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'spedy_service_invoices';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('fin_account_id').unsigned().nullable().references('id').inTable('fin_accounts').onUpdate('RESTRICT').onDelete('SET NULL').after('receipt_id');
            table.unique(['companies_id', 'fin_account_id'], 'uniq_spedy_nfse_company_fin_account');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropUnique(['companies_id', 'fin_account_id'], 'uniq_spedy_nfse_company_fin_account');
            table.dropForeign(['fin_account_id']);
            table.dropColumn('fin_account_id');
        });
    }
}
exports.default = SpedyServiceInvoiceFinAccount;
//# sourceMappingURL=1793000000002_spedy_service_invoice_fin_account.js.map