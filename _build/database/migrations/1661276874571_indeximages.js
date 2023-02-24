"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'indeximages';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.integer('bookrecords_id').notNullable().unsigned().references('bookrecords.id');
            table.integer('typebooks_id').notNullable().unsigned().references('typebooks.id');
            table.integer('companies_id').notNullable().unsigned().references('companies.id');
            table.integer('seq');
            table.string('ext', 5);
            table.string('file_name', 45);
            table.string('previous_file_name', 45);
            table.primary(['companies_id', 'bookrecords_id', 'typebooks_id', 'seq']);
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1661276874571_indeximages.js.map