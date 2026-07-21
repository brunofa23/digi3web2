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
            table.boolean('module_books').defaultTo(false);
            table.boolean('module_financial').defaultTo(false);
            table.boolean('module_lgpd').defaultTo(false);
            table.string('obs', 255).nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('module_books');
            table.dropColumn('module_financial');
            table.dropColumn('module_lgpd');
            table.dropColumn('obs');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1783000000000_company_add_modules_and_obs.js.map