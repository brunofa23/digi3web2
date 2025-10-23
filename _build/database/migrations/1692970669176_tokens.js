"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'tokens';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary().notNullable();
            table.string('name').notNullable();
            table.string('token', 1500);
            table.string('credentials', 1500);
            table.string('accountname').notNullable();
            table.boolean('status').defaultTo('false');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1692970669176_tokens.js.map