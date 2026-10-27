"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'indeximage_side_models';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('companies_id').unsigned().notNullable();
            table.integer('typebooks_id').unsigned().notNullable();
            table.integer('book').unsigned().notNullable();
            table.string('version', 40).notNullable().unique();
            table.string('status', 24).notNullable().defaultTo('queued');
            table.string('phase', 24).notNullable().defaultTo('queued');
            table.integer('processed').unsigned().notNullable().defaultTo(0);
            table.integer('total').unsigned().notNullable().defaultTo(0);
            table.json('training_samples').notNullable();
            table.json('validation_label_ids').notNullable();
            table.json('model_data').nullable();
            table.integer('requested_by').unsigned().notNullable();
            table.tinyint('active_slot').unsigned().nullable();
            table.string('error_message', 1000).nullable();
            table.string('lease_token', 36).nullable();
            table.dateTime('lease_expires_at').nullable();
            table.dateTime('started_at').nullable();
            table.dateTime('finished_at').nullable();
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.unique(['companies_id', 'typebooks_id', 'book', 'active_slot'], 'idx_side_model_active');
            table.index(['companies_id', 'typebooks_id', 'book', 'id'], 'idx_side_model_scope');
            table.index(['status', 'lease_expires_at', 'id'], 'idx_side_model_queue');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1793000000005_indeximage_side_models.js.map