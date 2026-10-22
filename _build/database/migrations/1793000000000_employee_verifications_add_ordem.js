"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class EmployeeVerificationsAddOrdem extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'employee_verifications';
    }
    async up() {
        if (!(await this.schema.hasColumn(this.tableName, 'ordem'))) {
            try {
                await this.schema.alterTable(this.tableName, (table) => {
                    table.integer('ordem').unsigned().nullable().after('inactive');
                });
            }
            catch (error) {
                const databaseError = error;
                if (databaseError.code !== 'ER_DUP_FIELDNAME' && databaseError.errno !== 1060)
                    throw error;
            }
        }
        await this.schema.raw("UPDATE employee_verifications SET ordem = CAST(SUBSTRING_INDEX(description, '-', 1) AS UNSIGNED) WHERE ordem IS NULL AND description REGEXP '^[0-9]+-'");
    }
    async down() {
    }
}
exports.default = EmployeeVerificationsAddOrdem;
//# sourceMappingURL=1793000000000_employee_verifications_add_ordem.js.map