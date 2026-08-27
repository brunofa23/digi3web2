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
        this.oldColumns = ['companies_id', 'drive_folder_id', 'drive_md5_checksum', 'drive_file_size'];
        this.newColumns = ['companies_id', 'typebooks_id', 'bookrecords_id', 'drive_folder_id', 'drive_md5_checksum', 'drive_file_size'];
    }
    async up() {
        if (await this.hasIndexColumns(this.newColumns))
            return;
        await this.dropIndexIfExists();
        await this.schema.alterTable(this.tableName, (table) => {
            table.index(this.newColumns, this.indexName);
        });
    }
    async down() {
        if (await this.hasIndexColumns(this.oldColumns))
            return;
        await this.dropIndexIfExists();
        await this.schema.alterTable(this.tableName, (table) => {
            table.index(this.oldColumns, this.indexName);
        });
    }
    async dropIndexIfExists() {
        try {
            await Database_1.default.rawQuery(`ALTER TABLE ${this.tableName} DROP INDEX ${this.indexName}`);
        }
        catch (error) {
            const databaseError = error;
            const indexNotFound = databaseError.code === 'ER_CANT_DROP_FIELD_OR_KEY' || databaseError.errno === 1091;
            if (!indexNotFound)
                throw error;
        }
    }
    async hasIndexColumns(columns) {
        const result = await Database_1.default.rawQuery(`
        SELECT COLUMN_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
        ORDER BY SEQ_IN_INDEX
      `, [this.tableName, this.indexName]);
        const rows = Array.isArray(result?.[0]) ? result[0] : result;
        if (!Array.isArray(rows))
            return false;
        const indexColumns = rows.map((row) => row.COLUMN_NAME || row.column_name);
        return indexColumns.length === columns.length && indexColumns.every((column, index) => column === columns[index]);
    }
}
exports.default = default_1;
//# sourceMappingURL=1786500000001_indeximages_update_drive_duplicate_lookup_index.js.map