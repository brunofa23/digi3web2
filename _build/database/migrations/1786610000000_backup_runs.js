"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'backup_runs';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.string('run_id', 80).notNullable();
            table.string('kind', 40).notNullable().defaultTo('DATABASE_ACERVO');
            table.string('status', 20).notNullable().defaultTo('RUNNING');
            table.integer('expected_companies').notNullable().defaultTo(0);
            table.integer('success_companies').notNullable().defaultTo(0);
            table.integer('error_companies').notNullable().defaultTo(0);
            table.integer('pending_companies').notNullable().defaultTo(0);
            table.timestamp('started_at', { useTz: true }).nullable();
            table.timestamp('finished_at', { useTz: true }).nullable();
            table.timestamp('last_heartbeat_at', { useTz: true }).nullable();
            table.text('error_message').nullable();
            table.json('metadata').nullable();
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.unique(['run_id', 'kind'], 'backup_runs_run_kind_unique');
            table.index(['kind', 'started_at'], 'backup_runs_kind_started_idx');
            table.index(['status', 'last_heartbeat_at'], 'backup_runs_status_heartbeat_idx');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1786610000000_backup_runs.js.map