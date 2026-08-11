"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'support_tickets';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary();
            table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('users_id').notNullable().unsigned().references('id').inTable('users').onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('assigned_users_id').nullable().unsigned().references('id').inTable('users').onUpdate('RESTRICT').onDelete('SET NULL');
            table.string('request_type', 30).notNullable();
            table.string('status', 30).notNullable().defaultTo('aberto');
            table.text('description').notNullable();
            table.timestamp('opened_at', { useTz: true }).notNullable();
            table.timestamp('resolved_at', { useTz: true }).nullable();
            table.timestamp('created_at', { useTz: true }).notNullable();
            table.timestamp('updated_at', { useTz: true }).notNullable();
            table.index(['companies_id', 'status'], 'support_tickets_company_status_idx');
            table.index(['companies_id', 'request_type'], 'support_tickets_company_type_idx');
            table.index(['companies_id', 'opened_at'], 'support_tickets_company_opened_idx');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1782350000000_support_tickets.js.map