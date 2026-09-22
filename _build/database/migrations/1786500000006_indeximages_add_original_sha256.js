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
        this.tableName = 'indeximages';
        this.indexName = 'indeximages_original_sha256_unique';
    }
    async up() {
        const hasColumn = await this.hasColumn('original_sha256');
        if (!hasColumn) {
            try {
                await this.schema.alterTable(this.tableName, (table) => {
                    table.string('original_sha256', 64).nullable().after('drive_md5_checksum');
                });
            }
            catch (error) {
                if (!this.isDuplicateColumnError(error))
                    throw error;
            }
        }
        const hasIndex = await this.hasIndex(this.indexName);
        if (!hasIndex) {
            await this.schema.alterTable(this.tableName, (table) => {
                table.unique(['companies_id', 'typebooks_id', 'bookrecords_id', 'drive_folder_id', 'original_sha256'], this.indexName);
            });
        }
    }
    async down() {
        if (await this.hasIndex(this.indexName)) {
            await this.schema.alterTable(this.tableName, (table) => {
                table.dropUnique(['companies_id', 'typebooks_id', 'bookrecords_id', 'drive_folder_id', 'original_sha256'], this.indexName);
            });
        }
        if (await this.hasColumn('original_sha256')) {
            await this.schema.alterTable(this.tableName, (table) => {
                table.dropColumn('original_sha256');
            });
        }
    }
    async hasIndex(indexName) {
        const result = await Database_1.default.rawQuery(`
        SELECT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
      `, [this.tableName, indexName]);
        const rows = Array.isArray(result?.[0]) ? result[0] : result;
        return Array.isArray(rows) && rows.length > 0;
    }
    async hasColumn(columnName) {
        const result = await Database_1.default.rawQuery(`
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
      `, [this.tableName, columnName]);
        const rows = Array.isArray(result?.[0]) ? result[0] : result;
        return Array.isArray(rows) && rows.length > 0;
    }
    isDuplicateColumnError(error) {
        const databaseError = error;
        return databaseError.code === 'ER_DUP_FIELDNAME' || databaseError.errno === 1060;
    }
}
exports.default = default_1;
//# sourceMappingURL=1786500000006_indeximages_add_original_sha256.js.map