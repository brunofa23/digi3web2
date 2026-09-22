"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class EmployeeVerificationsAddLocal extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'employee_verifications';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('local', 20).notNullable().defaultTo('receipt').after('description');
            table.index(['companies_id', 'local'], 'employee_verifications_company_local_idx');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropIndex(['companies_id', 'local'], 'employee_verifications_company_local_idx');
            table.dropColumn('local');
        });
    }
}
exports.default = EmployeeVerificationsAddLocal;
//# sourceMappingURL=1783580000000_employee_verifications_add_local.js.map