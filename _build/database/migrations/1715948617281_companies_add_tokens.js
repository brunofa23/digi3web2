"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'companies';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('cloud').notNullable().unsigned().references('tokens.id').defaultTo(1);
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('cloud');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1715948617281_companies_add_tokens.js.map