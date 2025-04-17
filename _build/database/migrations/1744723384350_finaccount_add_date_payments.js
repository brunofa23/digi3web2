"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'fin_accounts';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.datetime('date_conciliation').after('data_billing');
            table.integer('id_replication').after('fin_paymentmethod_id').nullable().unsigned().references('id').inTable('fin_accounts');
            table.decimal('amount_paid', 10, 2).nullable().after('amount');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, table => {
            table.dropColumn('date_conciliation');
            table.dropColumn('id_replication');
            table.dropColumn('amount_paid');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1744723384350_finaccount_add_date_payments.js.map