"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'fin_classes';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('cost', 5).after('debit_credit');
            table.string('allocation', 5).after('cost');
            table.decimal('limit_amount', 10, 2).after('allocation');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, table => {
            table.dropColumn('cost');
            table.dropColumn('allocation');
            table.dropColumn('limit_amount');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1751566929398_fin_class_add_cust_allocation_financials.js.map