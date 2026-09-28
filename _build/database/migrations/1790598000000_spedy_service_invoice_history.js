"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class SpedyServiceInvoiceHistory extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'spedy_service_invoices';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.json('processing_history').nullable().after('processing_detail');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('processing_history');
        });
    }
}
exports.default = SpedyServiceInvoiceHistory;
//# sourceMappingURL=1790598000000_spedy_service_invoice_history.js.map