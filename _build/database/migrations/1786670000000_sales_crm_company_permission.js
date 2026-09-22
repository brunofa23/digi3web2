"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.permissiongroupId = 47;
    }
    async up() {
        this.schema.alterTable('sales_opportunities', (table) => {
            table.integer('companies_id').unsigned().nullable().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('SET NULL');
            table.index(['companies_id', 'sales_stage_id'], 'sales_opportunities_company_stage_idx');
        });
        const permission = await Database_1.default.from('permissiongroups').where('id', this.permissiongroupId).first();
        if (!permission) {
            await Database_1.default.table('permissiongroups').insert({
                id: this.permissiongroupId,
                name: 'Acesso ao CRM',
                desc: 'Permite acessar e operar o CRM da empresa.',
                inactive: false,
            });
        }
    }
    async down() {
        await Database_1.default.from('groupxpermissions').where('permissiongroup_id', this.permissiongroupId).delete();
        await Database_1.default.from('permissiongroups').where('id', this.permissiongroupId).delete();
        this.schema.alterTable('sales_opportunities', (table) => {
            table.dropIndex(['companies_id', 'sales_stage_id'], 'sales_opportunities_company_stage_idx');
            table.dropColumn('companies_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1786670000000_sales_crm_company_permission.js.map