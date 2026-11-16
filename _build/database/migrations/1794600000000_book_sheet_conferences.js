"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    async up() {
        if (!(await this.schema.hasTable('book_sheet_conferences')))
            await this.schema.createTable('book_sheet_conferences', (table) => {
                table.increments('id');
                table.integer('companies_id').unsigned().notNullable();
                table.integer('typebooks_id').unsigned().notNullable();
                table.integer('book').unsigned().notNullable();
                table.integer('last_record_id').unsigned().nullable();
                table.integer('pending_record_id').unsigned().nullable();
                table.integer('target_record_id').unsigned().nullable();
                table.string('status', 20).notNullable().defaultTo('active');
                table.integer('checked_count').unsigned().notNullable().defaultTo(0);
                table.timestamp('created_at', { useTz: true });
                table.timestamp('updated_at', { useTz: true });
                table.unique(['companies_id', 'typebooks_id', 'book'], 'idx_book_sheet_conference_book');
            });
        if (!(await this.schema.hasTable('book_sheet_conference_items')))
            await this.schema.createTable('book_sheet_conference_items', (table) => {
                table.increments('id');
                table.integer('companies_id').unsigned().notNullable();
                table.integer('typebooks_id').unsigned().notNullable();
                table.integer('book').unsigned().notNullable();
                table.integer('bookrecords_id').unsigned().notNullable();
                table.integer('seq').nullable();
                table.string('file_name', 255).nullable();
                table.string('file_fingerprint', 255).nullable();
                table.integer('detected_sheet').nullable();
                table.decimal('confidence', 5, 4).nullable();
                table.string('status', 20).notNullable();
                table.string('evidence', 500).nullable();
                table.string('source', 60).nullable();
                table.timestamp('processed_at', { useTz: true }).nullable();
                table.timestamp('created_at', { useTz: true });
                table.timestamp('updated_at', { useTz: true });
                table.unique(['companies_id', 'typebooks_id', 'bookrecords_id'], 'idx_book_sheet_item_record');
                table.index(['companies_id', 'typebooks_id', 'book', 'status'], 'idx_book_sheet_item_status');
            });
    }
    async down() {
        await this.schema.dropTable('book_sheet_conference_items');
        await this.schema.dropTable('book_sheet_conferences');
    }
}
exports.default = default_1;
//# sourceMappingURL=1794600000000_book_sheet_conferences.js.map