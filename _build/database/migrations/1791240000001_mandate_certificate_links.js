"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
class default_1 extends Schema_1.default {
    async up() {
        if (!(await this.hasColumn('image_certificates'))) {
            await Database_1.default.rawQuery('ALTER TABLE image_certificates ADD COLUMN mandate_certificate_id INT UNSIGNED NULL AFTER born_certificate_id');
        }
        if (!(await this.hasForeignKey('image_certificates'))) {
            await Database_1.default.rawQuery('ALTER TABLE image_certificates ADD CONSTRAINT fk_imgcert_mandate FOREIGN KEY (mandate_certificate_id) REFERENCES mandate_certificates(id) ON DELETE RESTRICT');
        }
        if (!(await this.hasIndex('image_certificates', 'idx_imgcert_comp_mandate'))) {
            await Database_1.default.rawQuery('ALTER TABLE image_certificates ADD INDEX idx_imgcert_comp_mandate (companies_id, mandate_certificate_id)');
        }
        if (!(await this.hasColumn('employee_verification_x_certificates'))) {
            await Database_1.default.rawQuery('ALTER TABLE employee_verification_x_certificates ADD COLUMN mandate_certificate_id INT UNSIGNED NULL AFTER death_certificate_id');
        }
        if (!(await this.hasForeignKey('employee_verification_x_certificates'))) {
            await Database_1.default.rawQuery('ALTER TABLE employee_verification_x_certificates ADD CONSTRAINT fk_empver_x_cert_mandate FOREIGN KEY (mandate_certificate_id) REFERENCES mandate_certificates(id) ON DELETE RESTRICT');
        }
        if (!(await this.hasIndex('employee_verification_x_certificates', 'uniq_empver_x_mandate'))) {
            await Database_1.default.rawQuery('ALTER TABLE employee_verification_x_certificates ADD UNIQUE INDEX uniq_empver_x_mandate (mandate_certificate_id, employee_verification_id)');
        }
    }
    async down() {
        if (await this.hasForeignKey('employee_verification_x_certificates')) {
            await Database_1.default.rawQuery('ALTER TABLE employee_verification_x_certificates DROP FOREIGN KEY fk_empver_x_cert_mandate');
        }
        if (await this.hasIndex('employee_verification_x_certificates', 'uniq_empver_x_mandate')) {
            await Database_1.default.rawQuery('ALTER TABLE employee_verification_x_certificates DROP INDEX uniq_empver_x_mandate');
        }
        if (await this.hasColumn('employee_verification_x_certificates')) {
            await Database_1.default.rawQuery('ALTER TABLE employee_verification_x_certificates DROP COLUMN mandate_certificate_id');
        }
        if (await this.hasForeignKey('image_certificates')) {
            const longName = await this.hasForeignKeyName('image_certificates', 'image_certificates_mandate_certificate_id_foreign');
            await Database_1.default.rawQuery(`ALTER TABLE image_certificates DROP FOREIGN KEY ${longName ? 'image_certificates_mandate_certificate_id_foreign' : 'fk_imgcert_mandate'}`);
        }
        if (await this.hasIndex('image_certificates', 'idx_imgcert_comp_mandate')) {
            await Database_1.default.rawQuery('ALTER TABLE image_certificates DROP INDEX idx_imgcert_comp_mandate');
        }
        if (await this.hasColumn('image_certificates')) {
            await Database_1.default.rawQuery('ALTER TABLE image_certificates DROP COLUMN mandate_certificate_id');
        }
    }
    async hasColumn(table) {
        return this.schema.hasColumn(table, 'mandate_certificate_id');
    }
    async hasForeignKey(table) {
        const result = await Database_1.default.rawQuery("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'mandate_certificate_id' AND REFERENCED_TABLE_NAME = 'mandate_certificates' LIMIT 1", [table]);
        return result[0].length > 0;
    }
    async hasForeignKeyName(table, name) {
        const result = await Database_1.default.rawQuery('SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? LIMIT 1', [table, name]);
        return result[0].length > 0;
    }
    async hasIndex(table, index) {
        const result = await Database_1.default.rawQuery('SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1', [table, index]);
        return result[0].length > 0;
    }
}
exports.default = default_1;
default_1.disableTransactions = true;
//# sourceMappingURL=1791240000001_mandate_certificate_links.js.map