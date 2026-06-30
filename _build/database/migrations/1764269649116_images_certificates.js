"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'image_certificates';
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
            table
                .integer('book_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('books')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table
                .integer('married_certificate_id')
                .unsigned()
                .references('id')
                .inTable('married_certificates')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT')
                .nullable();
            table.integer('seq').notNullable();
            table.string('ext', 5).nullable();
            table.string('file_name', 200).nullable();
            table.string('description', 50).nullable();
            table.string('path', 200).nullable();
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.index(['companies_id', 'book_id'], 'idx_imgcert_comp_book');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1764269649116_images_certificates.js.map