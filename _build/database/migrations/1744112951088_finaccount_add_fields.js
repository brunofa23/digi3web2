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
            table.datetime('date').after('fin_paymentmethod_id');
            table.dateTime('date_due').after('date');
            table.boolean('replicate').after('cost');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, table => {
            table.dropColumn('fin_paymentmethod_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1744112951088_finaccount_add_fields.js.map