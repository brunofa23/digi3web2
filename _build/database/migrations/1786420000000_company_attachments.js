"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'company_attachments';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table
                .integer('companies_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('companies')
                .onUpdate('RESTRICT')
                .onDelete('CASCADE');
            table.string('description', 120).notNullable();
            table.string('original_name', 255).notNullable();
            table.string('file_name', 255).notNullable();
            table.string('mime_type', 120).nullable();
            table.string('extension', 10).notNullable();
            table.bigInteger('size').unsigned().nullable();
            table.string('drive_file_id', 200).notNullable();
            table.string('drive_folder_id', 200).notNullable();
            table.integer('uploaded_by').unsigned().nullable();
            table.timestamp('deleted_at', { useTz: true }).nullable();
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.index(['companies_id', 'deleted_at'], 'company_attachments_company_deleted_idx');
            table.index(['drive_file_id'], 'company_attachments_drive_file_idx');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1786420000000_company_attachments.js.map