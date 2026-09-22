"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'backup_company_statuses';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('backup_run_id').notNullable().unsigned().references('id').inTable('backup_runs').onDelete('CASCADE');
            table.integer('companies_id').notNullable().unsigned().index();
            table.string('company_name', 120).nullable();
            table.string('status', 20).notNullable().defaultTo('PENDING');
            table.timestamp('started_at', { useTz: true }).nullable();
            table.timestamp('finished_at', { useTz: true }).nullable();
            table.text('error_message').nullable();
            table.json('metadata').nullable();
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.unique(['backup_run_id', 'companies_id'], 'backup_company_statuses_run_company_unique');
            table.index(['backup_run_id', 'status'], 'backup_company_statuses_run_status_idx');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1786610000001_backup_company_statuses.js.map