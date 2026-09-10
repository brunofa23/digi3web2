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
        this.tableName = 'employee_verification_x_certificates';
    }
    async up() {
        if (!(await this.hasColumn('death_certificate_id'))) {
            await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        ADD COLUMN death_certificate_id INT UNSIGNED NULL AFTER born_certificate_id
      `);
        }
        if (!(await this.hasForeignKey('fk_empver_x_cert_death'))) {
            try {
                await this.schema.raw(`
          ALTER TABLE ${this.tableName}
          ADD CONSTRAINT fk_empver_x_cert_death
            FOREIGN KEY (death_certificate_id)
            REFERENCES death_certificates(id)
            ON UPDATE RESTRICT
            ON DELETE RESTRICT
        `);
            }
            catch (error) {
                const errorCode = error?.code;
                const errorNumber = error?.errno;
                if (errorCode !== 'ER_FK_DUP_NAME' && errorNumber !== 1826)
                    throw error;
            }
        }
        if (!(await this.hasIndex('uniq_empver_x_cert_death'))) {
            await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        ADD UNIQUE INDEX uniq_empver_x_cert_death
          (death_certificate_id, employee_verification_id)
      `);
        }
        if (!(await this.hasIndex('idx_empver_x_cert_comp_death'))) {
            await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        ADD INDEX idx_empver_x_cert_comp_death
          (companies_id, death_certificate_id)
      `);
        }
    }
    async down() {
        if (await this.hasForeignKey('fk_empver_x_cert_death')) {
            await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        DROP FOREIGN KEY fk_empver_x_cert_death
      `);
        }
        if (await this.hasIndex('uniq_empver_x_cert_death')) {
            await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        DROP INDEX uniq_empver_x_cert_death
      `);
        }
        if (await this.hasIndex('idx_empver_x_cert_comp_death')) {
            await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        DROP INDEX idx_empver_x_cert_comp_death
      `);
        }
        if (await this.hasColumn('death_certificate_id')) {
            await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        DROP COLUMN death_certificate_id
      `);
        }
    }
    async hasColumn(columnName) {
        const result = await Database_1.default.rawQuery(`
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
        LIMIT 1
      `, [this.tableName, columnName]);
        return result[0].length > 0;
    }
    async hasIndex(indexName) {
        const result = await Database_1.default.rawQuery(`
        SELECT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
        LIMIT 1
      `, [this.tableName, indexName]);
        return result[0].length > 0;
    }
    async hasForeignKey(constraintName) {
        const result = await Database_1.default.rawQuery(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND CONSTRAINT_NAME = ?
          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        LIMIT 1
      `, [this.tableName, constraintName]);
        return result[0].length > 0;
    }
}
exports.default = default_1;
//# sourceMappingURL=1786620000005_employee_verification_x_certificates_add_death_certificate_id.js.map