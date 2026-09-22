"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'groupxpermissions';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('companies_id').unsigned().nullable()
                .references('id').inTable('companies').onUpdate('CASCADE').onDelete('CASCADE');
            table.index(['companies_id', 'usergroup_id', 'permissiongroup_id'], 'groupxpermissions_company_scope_idx');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropIndex(['companies_id', 'usergroup_id', 'permissiongroup_id'], 'groupxpermissions_company_scope_idx');
            table.dropColumn('companies_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1786680000000_groupxpermissions_company_scope.js.map