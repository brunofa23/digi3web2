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
            table.string('payment_method', 15).nullable().after('debit_credit');
            table.string('cost', 10).notNullable().after('debit_credit');
            table.boolean('ir').defaultTo(false).after('debit_credit');
            table.string('obs', 255).notNullable().after('debit_credit');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('payment_method');
            table.dropColumn('cost');
            table.dropColumn('ir');
            table.dropColumn('obs');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1743096190749_finaccount_add_columns.js.map