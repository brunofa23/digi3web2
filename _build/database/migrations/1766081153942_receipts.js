"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'receipts';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('order_certificate_id').notNullable().unsigned().references('id').inTable('order_certificates').onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('service_id').notNullable().unsigned().references('id').inTable('services').onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('user_id').notNullable().unsigned().references('id').inTable('users').onUpdate('RESTRICT').onDelete('RESTRICT');
            table.string('applicant', 90).nullable();
            table.string('cpf_applicant', 11).nullable();
            table.string('registered1', 90).nullable();
            table.string('cpf_registered1', 11).nullable();
            table.string('registered2', 90).nullable();
            table.string('cpf_registered2', 11).nullable();
            table.integer('typebook_id').nullable().unsigned().references('id').inTable('typebooks').onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('book').nullable();
            table.integer('sheet').nullable();
            table.string('side').nullable();
            table.date('date_prevision').nullable();
            table.date('date_stamp').nullable();
            table.datetime('date_marriage').nullable();
            table.string('security_sheet', 50).nullable();
            table.string('habilitation_proccess', 50).nullable();
            table.string('status', 15).nullable();
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1766081153942_receipts.js.map