"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'public_order_certificate_links';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table
                .integer('companies_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('companies')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table.string('type', 30).notNullable();
            table.string('token', 128).notNullable().unique();
            table.boolean('active').notNullable().defaultTo(true);
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.index(['companies_id', 'type'], 'idx_pub_order_cert_company_type');
            table.index(['token', 'active'], 'idx_pub_order_cert_token_active');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1783590000000_public_order_certificate_links.js.map