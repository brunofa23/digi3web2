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
        this.indexName = 'indeximages_drive_file_id_idx';
    }
    async up() {
        const hasColumn = await this.schema.hasColumn(this.tableName, 'drive_file_id');
        if (!hasColumn) {
            await this.schema.alterTable(this.tableName, (table) => {
                table.string('drive_file_id', 200).nullable().after('file_name');
            });
        }
        const hasIndex = await this.hasDriveFileIdIndex();
        if (!hasIndex) {
            await this.schema.alterTable(this.tableName, (table) => {
                table.index(['drive_file_id'], this.indexName);
            });
        }
    }
    async down() {
        const hasColumn = await this.schema.hasColumn(this.tableName, 'drive_file_id');
        if (!hasColumn)
            return;
        const hasIndex = await this.hasDriveFileIdIndex();
        if (hasIndex) {
            await this.schema.alterTable(this.tableName, (table) => {
                table.dropIndex(['drive_file_id'], this.indexName);
            });
        }
        await this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('drive_file_id');
        });
    }
    async hasDriveFileIdIndex() {
        const result = await Database_1.default.rawQuery(`
        SELECT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND (INDEX_NAME = ? OR COLUMN_NAME = ?)
      `, [this.tableName, this.indexName, 'drive_file_id']);
        const rows = Array.isArray(result?.[0]) ? result[0] : result;
        return Array.isArray(rows) && rows.length > 0;
    }
}
exports.default = default_1;
//# sourceMappingURL=1786410000000_indeximages_add_drive_file_id.js.map