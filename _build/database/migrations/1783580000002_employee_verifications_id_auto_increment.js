"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
class EmployeeVerificationsIdAutoIncrement extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'employee_verifications';
    }
    async up() {
        await this.dropForeignIfExists('employee_verification_x_receipts', 'fk_empver_x_rec_empver_id');
        await this.dropForeignIfExists('employee_verification_x_certificates', 'fk_empver_x_cert_empver_id');
        await this.schema.raw(`
      ALTER TABLE ${this.tableName}
      MODIFY id INT UNSIGNED NOT NULL AUTO_INCREMENT
    `);
        await this.addEmployeeVerificationForeign('employee_verification_x_receipts', 'fk_empver_x_rec_empver_id');
        await this.addEmployeeVerificationForeign('employee_verification_x_certificates', 'fk_empver_x_cert_empver_id');
    }
    async down() {
        await this.dropForeignIfExists('employee_verification_x_receipts', 'fk_empver_x_rec_empver_id');
        await this.dropForeignIfExists('employee_verification_x_certificates', 'fk_empver_x_cert_empver_id');
        await this.schema.raw(`
      ALTER TABLE ${this.tableName}
      MODIFY id INT UNSIGNED NOT NULL
    `);
        await this.addEmployeeVerificationForeign('employee_verification_x_receipts', 'fk_empver_x_rec_empver_id');
        await this.addEmployeeVerificationForeign('employee_verification_x_certificates', 'fk_empver_x_cert_empver_id');
    }
    async dropForeignIfExists(tableName, foreignName) {
        const hasForeign = await this.hasForeign(tableName, foreignName);
        if (!hasForeign)
            return;
        await this.schema.raw(`
      ALTER TABLE ${tableName}
      DROP FOREIGN KEY ${foreignName}
    `);
    }
    async addEmployeeVerificationForeign(tableName, foreignName) {
        const hasTable = await this.schema.hasTable(tableName);
        if (!hasTable)
            return;
        const hasForeign = await this.hasForeign(tableName, foreignName);
        if (hasForeign)
            return;
        await this.schema.raw(`
      ALTER TABLE ${tableName}
      ADD CONSTRAINT ${foreignName}
      FOREIGN KEY (employee_verification_id)
      REFERENCES ${this.tableName}(id)
      ON UPDATE RESTRICT
      ON DELETE RESTRICT
    `);
    }
    async hasForeign(tableName, foreignName) {
        const result = await Database_1.default.rawQuery(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND CONSTRAINT_NAME = ?
          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      `, [tableName, foreignName]);
        return result[0].length > 0;
    }
}
exports.default = EmployeeVerificationsIdAutoIncrement;
//# sourceMappingURL=1783580000002_employee_verifications_id_auto_increment.js.map