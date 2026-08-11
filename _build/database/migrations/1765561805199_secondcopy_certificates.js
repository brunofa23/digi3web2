"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'secondcopy_certificates';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('documenttype_id').nullable().unsigned().references('documenttypes.id').onDelete('CASCADE').onUpdate('CASCADE');
            table.string('payment_method', 10).nullable;
            table.integer('applicant').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT');
            table.integer('registered1').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT');
            table.integer('book1').nullable();
            table.integer('sheet1').nullable();
            table.string('city1').nullable;
            table.integer('registered2').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT');
            table.integer('book2').nullable();
            table.integer('sheet2').nullable();
            table.string('city2').nullable;
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1765561805199_secondcopy_certificates.js.map