"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class EmployeeVerificationXCertificates extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'employee_verification_x_certificates';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table
                .integer('married_certificate_id')
                .unsigned()
                .notNullable();
            table
                .foreign('married_certificate_id', 'fk_empver_x_cert_married')
                .references('id')
                .inTable('married_certificates')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table
                .integer('companies_id')
                .unsigned()
                .notNullable();
            table
                .foreign('companies_id', 'fk_empver_x_cert_company')
                .references('id')
                .inTable('companies')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table
                .integer('employee_verification_id')
                .unsigned()
                .notNullable();
            table
                .foreign('employee_verification_id', 'fk_empver_x_cert_empver_id')
                .references('id')
                .inTable('employee_verifications')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table
                .integer('user_id')
                .unsigned()
                .notNullable();
            table
                .foreign('user_id', 'fk_empver_x_cert_user')
                .references('id')
                .inTable('users')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table.string('status', 80).notNullable();
            table.dateTime('date').notNullable();
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.unique(['married_certificate_id', 'employee_verification_id'], 'uniq_empver_x_cert');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = EmployeeVerificationXCertificates;
//# sourceMappingURL=1783580000001_employee_verification_x_certificates.js.map