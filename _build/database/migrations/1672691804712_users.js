"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'users';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.primary(['id', 'companies_id']);
            table.unique(['companies_id', 'username']);
            table.increments('id').primary();
            table.integer('companies_id').notNullable().unsigned().references('companies.id');
            table.string('name', 45);
            table.string('username', 45).notNullable();
            table.string('email', 255).notNullable();
            table.string('password', 180).notNullable();
            table.string('remember_me_token').nullable();
            table.integer('permission_level').unsigned().notNullable().defaultTo(5);
            table.boolean('superuser');
            table.boolean('status');
            table.timestamp('created_at', { useTz: true }).notNullable();
            table.timestamp('updated_at', { useTz: true }).notNullable();
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1672691804712_users.js.map