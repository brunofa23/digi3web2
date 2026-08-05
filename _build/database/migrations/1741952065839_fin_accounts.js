"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'fin_accounts';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onDelete('CASCADE');
            table.integer('fin_emp_id').notNullable().unsigned().references('id').inTable('fin_emps').onDelete('CASCADE').onUpdate('CASCADE');
            table.integer('fin_class_id').notNullable().unsigned().references('id').inTable('fin_classes').onDelete('CASCADE').onUpdate('CASCADE');
            table.string('description', 100).notNullable();
            table.decimal('amount', 10, 2).notNullable();
            table.dateTime('data_billing');
            table.boolean('excluded').defaultTo('false');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1741952065839_fin_accounts.js.map