"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'municipalities';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.integer('ibge_code').unsigned().primary();
            table.string('name', 120).notNullable();
            table.string('uf', 2).notNullable();
            table.integer('uf_ibge_code').unsigned().notNullable();
            table.index(['uf', 'name'], 'municipalities_uf_name_index');
            table.unique(['uf', 'name'], 'municipalities_uf_name_unique');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1792454400000_municipalities.js.map