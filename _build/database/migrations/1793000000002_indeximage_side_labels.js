"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'indeximage_side_labels';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('companies_id').unsigned().notNullable();
            table.integer('typebooks_id').unsigned().notNullable();
            table.integer('bookrecords_id').unsigned().notNullable();
            table.integer('seq').notNullable();
            table.integer('position').unsigned().notNullable();
            table.string('drive_file_id', 120).notNullable();
            table.string('file_name', 200).notNullable();
            table.string('label', 1).nullable();
            table.integer('reviewed_by').unsigned().nullable();
            table.timestamp('reviewed_at', { useTz: true }).nullable();
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.unique(['companies_id', 'typebooks_id', 'bookrecords_id', 'seq'], 'idx_side_label_image');
            table.unique(['companies_id', 'typebooks_id', 'position'], 'idx_side_label_position');
            table.index(['companies_id', 'typebooks_id', 'label'], 'idx_side_label_progress');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1793000000002_indeximage_side_labels.js.map