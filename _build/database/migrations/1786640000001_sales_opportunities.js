"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'sales_opportunities';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('company_id').unsigned().nullable().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('SET NULL');
            table.integer('sales_stage_id').unsigned().notNullable().references('id').inTable('sales_stages').onUpdate('RESTRICT').onDelete('RESTRICT');
            table.string('name', 120).notNullable();
            table.string('city', 100).nullable();
            table.string('contact_name', 120).nullable();
            table.string('phone', 30).nullable();
            table.string('interest', 255).nullable();
            table.text('notes').nullable();
            table.date('last_contact_date').nullable();
            table.date('next_contact_date').nullable();
            table.decimal('proposal_value', 15, 2).nullable();
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.index(['sales_stage_id']);
            table.index(['company_id']);
            table.index(['next_contact_date']);
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1786640000001_sales_opportunities.js.map