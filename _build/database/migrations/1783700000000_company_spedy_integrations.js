"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class CompanySpedyIntegrations extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'company_spedy_integrations';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('companies_id').unsigned().notNullable().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('CASCADE');
            table.string('environment', 20).notNullable().defaultTo('sandbox');
            table.string('spedy_company_id', 80).nullable();
            table.text('spedy_api_key').nullable();
            table.boolean('is_owner').notNullable().defaultTo(false);
            table.boolean('active').notNullable().defaultTo(true);
            table.timestamp('last_sync_at', { useTz: true }).nullable();
            table.json('last_company_snapshot').nullable();
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.unique(['companies_id', 'environment']);
            table.index(['spedy_company_id', 'environment']);
            table.index(['environment', 'is_owner', 'active']);
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = CompanySpedyIntegrations;
//# sourceMappingURL=1783700000000_company_spedy_integrations.js.map