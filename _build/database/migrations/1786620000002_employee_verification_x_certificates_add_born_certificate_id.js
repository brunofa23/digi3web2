"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
class EmployeeVerificationXCertificatesAddBornCertificateId extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'employee_verification_x_certificates';
    }
    async up() {
        if (await this.hasColumn('born_certificate_id')) {
            await this.addMarriedForeignKeyIfMissing();
            return;
        }
        await this.dropForeignKeyIfExists('fk_empver_x_cert_married');
        await this.dropUniqueIfExists('uniq_empver_x_cert');
        await this.schema.raw(`
      ALTER TABLE ${this.tableName}
      MODIFY married_certificate_id INT UNSIGNED NULL
    `);
        await this.schema.raw(`
      ALTER TABLE ${this.tableName}
      ADD COLUMN born_certificate_id INT UNSIGNED NULL AFTER married_certificate_id,
      ADD CONSTRAINT fk_empver_x_cert_married
        FOREIGN KEY (married_certificate_id)
        REFERENCES married_certificates(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,
      ADD CONSTRAINT fk_empver_x_cert_born
        FOREIGN KEY (born_certificate_id)
        REFERENCES born_certificates(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,
      ADD UNIQUE INDEX uniq_empver_x_cert_married
        (married_certificate_id, employee_verification_id),
      ADD UNIQUE INDEX uniq_empver_x_cert_born
        (born_certificate_id, employee_verification_id),
      ADD INDEX idx_empver_x_cert_comp_born
        (companies_id, born_certificate_id)
    `);
    }
    async down() {
        await this.dropForeignKeyIfExists('fk_empver_x_cert_married');
        await this.schema.raw(`
      ALTER TABLE ${this.tableName}
        DROP INDEX idx_empver_x_cert_comp_born,
        DROP INDEX uniq_empver_x_cert_born,
        DROP INDEX uniq_empver_x_cert_married,
        DROP FOREIGN KEY fk_empver_x_cert_born,
        DROP COLUMN born_certificate_id
    `);
        await this.schema.raw(`
      ALTER TABLE ${this.tableName}
      MODIFY married_certificate_id INT UNSIGNED NOT NULL,
      ADD UNIQUE INDEX uniq_empver_x_cert
        (married_certificate_id, employee_verification_id),
      ADD CONSTRAINT fk_empver_x_cert_married
        FOREIGN KEY (married_certificate_id)
        REFERENCES married_certificates(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
    `);
    }
    async dropForeignKeyIfExists(constraintName) {
        if (!(await this.hasForeignKey(constraintName)))
            return;
        await this.schema.raw(`
      ALTER TABLE ${this.tableName}
      DROP FOREIGN KEY ${constraintName}
    `);
    }
    async dropUniqueIfExists(indexName) {
        const result = await Database_1.default.rawQuery(`
        SELECT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
        LIMIT 1
      `, [this.tableName, indexName]);
        if (!result[0].length)
            return;
        try {
            await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        DROP INDEX ${indexName}
      `);
        }
        catch (error) {
            const errorCode = error?.code;
            const errorNumber = error?.errno;
            if (errorCode !== 'ER_CANT_DROP_FIELD_OR_KEY' && errorNumber !== 1091) {
                throw error;
            }
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
    async addMarriedForeignKeyIfMissing() {
        if (await this.hasForeignKey('fk_empver_x_cert_married'))
            return;
        try {
            await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        ADD CONSTRAINT fk_empver_x_cert_married
          FOREIGN KEY (married_certificate_id)
          REFERENCES married_certificates(id)
          ON UPDATE RESTRICT
          ON DELETE RESTRICT
      `);
        }
        catch (error) {
            const errorCode = error?.code;
            const errorNumber = error?.errno;
            if (errorCode !== 'ER_FK_DUP_NAME' && errorNumber !== 1826) {
                throw error;
            }
        }
    }
}
exports.default = EmployeeVerificationXCertificatesAddBornCertificateId;
//# sourceMappingURL=1786620000002_employee_verification_x_certificates_add_born_certificate_id.js.map