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
        this.indexName = 'indeximages_drive_duplicate_lookup_idx';
    }
    async up() {
        const hasDriveFileSize = await this.schema.hasColumn(this.tableName, 'drive_file_size');
        const hasDriveMd5Checksum = await this.schema.hasColumn(this.tableName, 'drive_md5_checksum');
        const hasDriveFolderId = await this.schema.hasColumn(this.tableName, 'drive_folder_id');
        if (!hasDriveFileSize || !hasDriveMd5Checksum || !hasDriveFolderId) {
            await this.schema.alterTable(this.tableName, (table) => {
                if (!hasDriveFileSize)
                    table.bigInteger('drive_file_size').nullable().after('drive_file_id');
                if (!hasDriveMd5Checksum)
                    table.string('drive_md5_checksum', 32).nullable().after('drive_file_size');
                if (!hasDriveFolderId)
                    table.string('drive_folder_id', 200).nullable().after('drive_md5_checksum');
            });
        }
        const hasIndex = await this.hasDuplicateLookupIndex();
        if (!hasIndex) {
            await this.schema.alterTable(this.tableName, (table) => {
                table.index(['companies_id', 'typebooks_id', 'bookrecords_id', 'drive_folder_id', 'drive_md5_checksum', 'drive_file_size'], this.indexName);
            });
        }
    }
    async down() {
        const hasIndex = await this.hasDuplicateLookupIndex();
        if (hasIndex) {
            await this.schema.alterTable(this.tableName, (table) => {
                table.dropIndex(['companies_id', 'typebooks_id', 'bookrecords_id', 'drive_folder_id', 'drive_md5_checksum', 'drive_file_size'], this.indexName);
            });
        }
        const hasDriveFolderId = await this.schema.hasColumn(this.tableName, 'drive_folder_id');
        const hasDriveMd5Checksum = await this.schema.hasColumn(this.tableName, 'drive_md5_checksum');
        const hasDriveFileSize = await this.schema.hasColumn(this.tableName, 'drive_file_size');
        if (!hasDriveFolderId && !hasDriveMd5Checksum && !hasDriveFileSize)
            return;
        await this.schema.alterTable(this.tableName, (table) => {
            if (hasDriveFolderId)
                table.dropColumn('drive_folder_id');
            if (hasDriveMd5Checksum)
                table.dropColumn('drive_md5_checksum');
            if (hasDriveFileSize)
                table.dropColumn('drive_file_size');
        });
    }
    async hasDuplicateLookupIndex() {
        const result = await Database_1.default.rawQuery(`
        SELECT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
      `, [this.tableName, this.indexName]);
        const rows = Array.isArray(result?.[0]) ? result[0] : result;
        return Array.isArray(rows) && rows.length > 0;
    }
}
exports.default = default_1;
//# sourceMappingURL=1786500000000_indeximages_add_drive_metadata.js.map