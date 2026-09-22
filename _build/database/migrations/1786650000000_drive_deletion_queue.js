"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.batchesTable = 'drive_deletion_batches';
        this.itemsTable = 'drive_deletion_items';
    }
    async up() {
        this.schema.createTable(this.batchesTable, (table) => {
            table.bigIncrements('id');
            table.integer('companies_id').unsigned().notNullable();
            table.integer('typebooks_id').unsigned().notNullable();
            table.integer('user_id').unsigned().nullable();
            table.string('action', 30).notNullable();
            table.string('status', 20).notNullable().defaultTo('pending');
            table.integer('book').unsigned().notNullable();
            table.integer('start_cod').unsigned().notNullable();
            table.integer('end_cod').unsigned().notNullable();
            table.integer('total_items').unsigned().notNullable().defaultTo(0);
            table.integer('processed_items').unsigned().notNullable().defaultTo(0);
            table.integer('failed_items').unsigned().notNullable().defaultTo(0);
            table.text('last_error').nullable();
            table.timestamp('started_at').nullable();
            table.timestamp('finished_at').nullable();
            table.timestamp('created_at').notNullable();
            table.timestamp('updated_at').notNullable();
            table.index(['companies_id', 'status'], 'drive_deletion_batches_company_status_idx');
            table.index(['typebooks_id', 'book', 'start_cod', 'end_cod'], 'drive_deletion_batches_filter_idx');
        });
        this.schema.createTable(this.itemsTable, (table) => {
            table.bigIncrements('id');
            table.bigInteger('batch_id').unsigned().notNullable();
            table.integer('companies_id').unsigned().notNullable();
            table.integer('typebooks_id').unsigned().notNullable();
            table.bigInteger('bookrecords_id').unsigned().notNullable();
            table.integer('seq').unsigned().notNullable();
            table.string('drive_file_id', 200).nullable();
            table.string('file_name', 500).nullable();
            table.string('status', 20).notNullable().defaultTo('pending');
            table.integer('attempts').unsigned().notNullable().defaultTo(0);
            table.text('last_error').nullable();
            table.timestamp('processed_at').nullable();
            table.timestamp('created_at').notNullable();
            table.timestamp('updated_at').notNullable();
            table.foreign('batch_id').references('id').inTable(this.batchesTable);
            table.unique(['batch_id', 'bookrecords_id', 'seq'], 'drive_deletion_items_batch_record_seq_uq');
            table.index(['status', 'attempts'], 'drive_deletion_items_status_attempts_idx');
            table.index(['companies_id', 'typebooks_id', 'bookrecords_id'], 'drive_deletion_items_record_idx');
        });
    }
    async down() {
        this.schema.dropTable(this.itemsTable);
        this.schema.dropTable(this.batchesTable);
    }
}
exports.default = default_1;
//# sourceMappingURL=1786650000000_drive_deletion_queue.js.map