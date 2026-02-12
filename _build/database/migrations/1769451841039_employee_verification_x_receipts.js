"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class EmployeeVerificationXReceipts extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'employee_verification_x_receipts';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table
                .integer('receipt_id')
                .unsigned()
                .notNullable()
                .references('id')
                .inTable('receipts')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table
                .integer('companies_id')
                .unsigned()
                .notNullable()
                .references('id')
                .inTable('companies')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table
                .integer('employee_verification_id')
                .unsigned()
                .notNullable();
            table
                .foreign('employee_verification_id', 'fk_empver_x_rec_empver_id')
                .references('id')
                .inTable('employee_verifications')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table
                .integer('user_id')
                .unsigned()
                .notNullable()
                .references('id')
                .inTable('users')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table.dateTime('date').notNullable();
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.unique(['receipt_id', 'employee_verification_id'], 'uniq_empver_x_rec');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = EmployeeVerificationXReceipts;
//# sourceMappingURL=1769451841039_employee_verification_x_receipts.js.map