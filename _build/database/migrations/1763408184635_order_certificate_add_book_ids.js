"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'order_certificates';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('book_id').notNullable().unsigned().references('id').inTable('books')
                .after('companies_id').onUpdate('RESTRICT').onDelete('RESTRICT');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, table => {
            table.dropColumn('book_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1763408184635_order_certificate_add_book_ids.js.map