"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'mandate_certificates';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('companies_id').unsigned().notNullable().references('id').inTable('companies').onDelete('RESTRICT');
            table.integer('usr_id').unsigned().nullable().references('id').inTable('users').onDelete('RESTRICT');
            table.date('request_date').notNullable();
            table.dateTime('schedule_date').nullable();
            table.integer('mandate_type').unsigned().notNullable();
            table.integer('rectification_type').unsigned().nullable();
            table.integer('transcription_type').unsigned().nullable();
            table.boolean('has_power_of_attorney').nullable();
            table.string('applicant_name', 100).notNullable();
            table.string('applicant_cpf', 11).notNullable();
            table.string('applicant_whatsapp', 20).notNullable();
            table.string('applicant_phone', 20).nullable();
            table.string('applicant_email', 100).nullable();
            table.string('registered_data', 255).nullable();
            table.string('registered_city', 100).nullable();
            table.integer('book_number').unsigned().nullable();
            table.integer('sheet_number').unsigned().nullable();
            table.integer('term_number').unsigned().nullable();
            table.string('obs', 500).nullable();
            table.string('status_form', 10).notNullable().defaultTo('draft');
            table.boolean('inactive').notNullable().defaultTo(false);
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.index(['companies_id', 'applicant_cpf'], 'idx_mandate_company_cpf');
            table.index(['companies_id', 'request_date'], 'idx_mandate_company_request');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1791240000000_mandate_certificates.js.map