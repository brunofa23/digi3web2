"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'mandate_certificates';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('applicant_cpf', 11).nullable().alter();
            table.string('applicant_whatsapp', 20).nullable().alter();
        });
    }
    async down() {
        await Database_1.default.rawQuery('UPDATE mandate_certificates SET applicant_cpf = \'\' WHERE applicant_cpf IS NULL');
        await Database_1.default.rawQuery('UPDATE mandate_certificates SET applicant_whatsapp = \'\' WHERE applicant_whatsapp IS NULL');
        this.schema.alterTable(this.tableName, (table) => {
            table.string('applicant_cpf', 11).notNullable().alter();
            table.string('applicant_whatsapp', 20).notNullable().alter();
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1795300000000_mandate_contact_fields_nullable.js.map