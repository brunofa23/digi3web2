"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'communication_certificates';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('companies_id').unsigned().notNullable().references('id').inTable('companies').onDelete('RESTRICT');
            table.integer('usr_id').unsigned().nullable().references('id').inTable('users').onDelete('RESTRICT');
            table.date('registration_date').notNullable();
            table.string('registered_name', 255).notNullable();
            table.integer('service_type').unsigned().notNullable();
            table.integer('delivery_type').unsigned().notNullable();
            table.integer('communication_type').unsigned().notNullable();
            table.string('origin_office', 255).notNullable();
            table.string('origin_obs', 500).nullable();
            table.string('destination_office', 255).notNullable();
            table.string('destination_obs', 500).nullable();
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.index(['companies_id', 'registration_date'], 'idx_communication_company_date');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1791320000000_communication_certificates.js.map