"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'receipt_items';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('receipt_id').notNullable().unsigned().references('id').inTable('receipts').onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('service_id').notNullable().unsigned().references('id').inTable('services').onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('emolument_id').notNullable().unsigned().references('id').inTable('emoluments').onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('qtde').notNullable().defaultTo(0);
            table.decimal('amount', 10, 2).notNullable().defaultTo(0);
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1766083233999_receipt2s.js.map