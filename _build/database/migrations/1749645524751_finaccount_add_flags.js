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
            table.boolean('analyze').defaultTo(false).after('replicate');
            table.boolean('future').defaultTo(false).after('analyze');
            table.boolean('reserve').defaultTo(false).after('future');
            table.boolean('overplus').defaultTo(false).after('reserve');
            table.decimal('limit_amount', 10, 2).nullable().after('overplus');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('analyze');
            table.dropColumn('future');
            table.dropColumn('reserve');
            table.dropColumn('overplus');
            table.dropColumn('limit_amount');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1749645524751_finaccount_add_flags.js.map