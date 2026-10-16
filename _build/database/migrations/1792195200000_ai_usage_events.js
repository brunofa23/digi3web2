"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'ai_usage_events';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('companies_id').unsigned().notNullable().index();
            table.integer('user_id').unsigned().notNullable();
            table.string('use_case', 80).notNullable().index();
            table.string('provider', 40).notNullable();
            table.string('model', 80).notNullable();
            table.string('document_type', 40).notNullable();
            table.string('status', 30).notNullable();
            table.integer('input_tokens').unsigned().notNullable().defaultTo(0);
            table.integer('output_tokens').unsigned().notNullable().defaultTo(0);
            table.decimal('estimated_cost_usd', 12, 6).notNullable().defaultTo(0);
            table.integer('duration_ms').unsigned().notNullable().defaultTo(0);
            table.timestamp('created_at').notNullable().defaultTo(this.now());
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1792195200000_ai_usage_events.js.map