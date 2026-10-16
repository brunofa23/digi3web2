"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'spedy_nfse_export_jobs';
    }
    async up() {
        this.defer(async (db) => {
            if (await db.schema.hasTable(this.tableName))
                return;
            await db.schema.createTable(this.tableName, (table) => {
                table.increments('id');
                table.integer('companies_id').unsigned().notNullable().index();
                table.integer('user_id').unsigned().notNullable().index();
                table.string('format', 3).notNullable();
                table.string('status', 20).notNullable().index();
                table.integer('total').unsigned().notNullable();
                table.integer('processed').unsigned().notNullable().defaultTo(0);
                table.text('invoice_ids').notNullable();
                table.text('failures', 'longtext').nullable();
                table.string('file_name', 150).nullable();
                table.text('error_message').nullable();
                table.timestamps(true);
            });
        });
    }
    async down() {
        this.schema.dropTableIfExists(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1792200000001_spedy_nfse_export_jobs.js.map