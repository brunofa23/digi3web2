"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
class default_1 extends Schema_1.default {
    async up() {
        if (!(await this.schema.hasColumn('image_certificates', 'communication_certificate_id'))) {
            await Database_1.default.rawQuery('ALTER TABLE image_certificates ADD COLUMN communication_certificate_id INT UNSIGNED NULL AFTER secondcopy_certificate_id');
        }
        const foreignKey = await Database_1.default.rawQuery("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'image_certificates' AND COLUMN_NAME = 'communication_certificate_id' AND REFERENCED_TABLE_NAME = 'communication_certificates' LIMIT 1");
        if (!foreignKey[0].length) {
            await Database_1.default.rawQuery('ALTER TABLE image_certificates ADD CONSTRAINT fk_imgcert_communication FOREIGN KEY (communication_certificate_id) REFERENCES communication_certificates(id) ON DELETE RESTRICT');
        }
        const index = await Database_1.default.rawQuery("SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'image_certificates' AND INDEX_NAME = 'idx_imgcert_comp_communication' LIMIT 1");
        if (!index[0].length) {
            await Database_1.default.rawQuery('ALTER TABLE image_certificates ADD INDEX idx_imgcert_comp_communication (companies_id, communication_certificate_id)');
        }
    }
    async down() {
        const foreignKey = await Database_1.default.rawQuery("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'image_certificates' AND COLUMN_NAME = 'communication_certificate_id' AND REFERENCED_TABLE_NAME = 'communication_certificates' LIMIT 1");
        if (foreignKey[0].length) {
            await Database_1.default.rawQuery(`ALTER TABLE image_certificates DROP FOREIGN KEY ${foreignKey[0][0].CONSTRAINT_NAME}`);
        }
        const index = await Database_1.default.rawQuery("SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'image_certificates' AND INDEX_NAME = 'idx_imgcert_comp_communication' LIMIT 1");
        if (index[0].length)
            await Database_1.default.rawQuery('ALTER TABLE image_certificates DROP INDEX idx_imgcert_comp_communication');
        if (await this.schema.hasColumn('image_certificates', 'communication_certificate_id')) {
            await Database_1.default.rawQuery('ALTER TABLE image_certificates DROP COLUMN communication_certificate_id');
        }
    }
}
exports.default = default_1;
default_1.disableTransactions = true;
//# sourceMappingURL=1793000000008_image_certificates_add_communication_certificate_id.js.map