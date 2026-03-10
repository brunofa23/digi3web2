"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'married_certificates';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table
                .integer('typebook_id')
                .nullable()
                .unsigned()
                .references('id')
                .inTable('typebooks')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT')
                .after('status_id');
            table.integer('book1').nullable().after('dthr_divorce_spouse2');
            table.integer('sheet1').nullable().after('book1');
            table.string('term1').nullable().after('sheet1');
            table
                .integer('typebook_id2')
                .nullable()
                .unsigned()
                .references('id')
                .inTable('typebooks')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT')
                .after('typebook_id');
            table.integer('book2').nullable().after('term1');
            table.integer('sheet2').nullable().after('book2');
            table.string('term2').nullable().after('sheet2');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropForeign(['typebook_id']);
            table.dropForeign(['typebook_id2']);
            table.dropColumns('typebook_id', 'book1', 'sheet1', 'term1', 'typebook_id2', 'book2', 'sheet2', 'term2');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1770834008858_married_add_book1_sheet1_term1_typebook_ids.js.map