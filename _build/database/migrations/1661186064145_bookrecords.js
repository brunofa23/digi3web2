"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'bookrecords';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('typebooks_id').notNullable().unsigned().references('typebooks.id');
            table.integer('books_id').notNullable().unsigned().references('typebooks.books_id').onDelete('CASCADE');
            table.integer('companies_id').notNullable().unsigned().references('companies.id').onDelete('CASCADE');
            table.integer('cod');
            table.integer('book');
            table.integer('sheet');
            table.string('side');
            table.string('approximate_term');
            table.integer('indexbook');
            table.string('obs');
            table.string('letter');
            table.string('year');
            table.string('model');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1661186064145_bookrecords.js.map