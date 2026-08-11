"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'companies';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.decimal('licence_value', 10, 2).nullable();
            table.integer('due_date').nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('licence_value');
            table.dropColumn('due_date');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1783200000000_company_add_licence_due_date.js.map