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
            table.string('debit_credit', 2).notNullable().after('excluded');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('debit_credit');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1742402665558_finaccount_add_debit_credits.js.map