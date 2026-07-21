"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'fin_entity_document_emails';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onDelete('CASCADE');
            table.integer('fin_entity_id').notNullable().unsigned().references('id').inTable('fin_entities').onDelete('CASCADE');
            table.string('email', 90).notNullable();
            table.string('subject', 200).notNullable();
            table.text('body');
            table.string('file_name', 200).notNullable();
            table.integer('file_size').defaultTo(0);
            table.string('status', 20).notNullable().defaultTo('sent');
            table.text('error_message');
            table.timestamp('sent_at', { useTz: true });
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.index(['companies_id', 'fin_entity_id']);
            table.index(['companies_id', 'created_at']);
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1782380000000_fin_entity_document_emails.js.map