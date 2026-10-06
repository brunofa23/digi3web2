"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'drive_duplicate_folder_scans';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.integer('id').primary();
            table.string('status', 20).notNullable();
            table.string('run_token', 36).nullable();
            table.json('result').nullable();
            table.text('error_message').nullable();
            table.timestamp('started_at', { useTz: true }).nullable();
            table.timestamp('finished_at', { useTz: true }).nullable();
            table.timestamp('heartbeat_at', { useTz: true }).nullable();
            table.timestamp('created_at', { useTz: true }).notNullable();
            table.timestamp('updated_at', { useTz: true }).notNullable();
        });
        this.defer(async (db) => {
            await db.table(this.tableName).insert({ id: 1, status: 'IDLE', created_at: new Date(), updated_at: new Date() });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1786700000000_drive_duplicate_folder_scans.js.map