"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'situation';
        this.pivotTableName = 'company_situation';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.integer('id').unsigned().primary();
            table.string('description', 120).notNullable();
            table.boolean('inactive').notNullable().defaultTo(false);
        });
        this.schema.createTable(this.pivotTableName, (table) => {
            table.integer('companies_id').unsigned().notNullable()
                .references('id').inTable('companies')
                .onUpdate('RESTRICT')
                .onDelete('CASCADE');
            table.integer('situation_id').unsigned().notNullable()
                .references('id').inTable('situation')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table.primary(['companies_id', 'situation_id']);
            table.index(['situation_id'], 'company_situation_situation_id_idx');
        });
    }
    async down() {
        this.schema.dropTable(this.pivotTableName);
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1783000000001_situations.js.map