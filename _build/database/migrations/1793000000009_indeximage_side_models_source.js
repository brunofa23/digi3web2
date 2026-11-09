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
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('source_model_id').unsigned().nullable().after('book');
            table.index(['source_model_id'], 'idx_side_model_source');
            table.foreign('source_model_id').references('id').inTable(this.tableName).onDelete('SET NULL').onUpdate('CASCADE');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropForeign(['source_model_id']);
            table.dropIndex(['source_model_id'], 'idx_side_model_source');
            table.dropColumn('source_model_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1793000000009_indeximage_side_models_source.js.map