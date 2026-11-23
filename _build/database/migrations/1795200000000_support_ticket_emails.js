"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    async up() {
        this.schema.alterTable('support_tickets', (table) => {
            table.string('client_email', 255).nullable().after('contact');
        });
        this.schema.createTable('support_ticket_settings', (table) => {
            table.increments('id').primary();
            table.text('support_emails').nullable();
            table.timestamp('created_at', { useTz: true }).notNullable();
            table.timestamp('updated_at', { useTz: true }).notNullable();
        });
    }
    async down() {
        this.schema.dropTable('support_ticket_settings');
        this.schema.alterTable('support_tickets', (table) => {
            table.dropColumn('client_email');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1795200000000_support_ticket_emails.js.map