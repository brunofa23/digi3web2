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
        this.tableName = 'indeximage_ocr_checks';
        this.indexName = 'idx_img_ocr_check_marker';
    }
    async up() {
        const hasColumn = await this.hasColumn('line_marker');
        if (!hasColumn) {
            try {
                await this.schema.alterTable(this.tableName, (table) => {
                    table.boolean('line_marker').notNullable().defaultTo(false).after('review_status');
                });
            }
            catch (error) {
                if (!this.isDuplicateColumnError(error))
                    throw error;
            }
        }
        const hasIndex = await this.hasIndex();
        if (!hasIndex) {
            try {
                await this.schema.alterTable(this.tableName, (table) => {
                    table.index(['companies_id', 'typebooks_id', 'line_marker'], this.indexName);
                });
            }
            catch (error) {
                if (!this.isDuplicateIndexError(error))
                    throw error;
            }
        }
    }
    async down() {
        const hasColumn = await this.hasColumn('line_marker');
        if (!hasColumn)
            return;
        const hasIndex = await this.hasIndex();
        if (hasIndex) {
            await this.schema.alterTable(this.tableName, (table) => {
                table.dropIndex(['companies_id', 'typebooks_id', 'line_marker'], this.indexName);
            });
        }
        try {
            await this.schema.alterTable(this.tableName, (table) => {
                table.dropColumn('line_marker');
            });
        }
        catch (error) {
            if (!this.isMissingColumnError(error))
                throw error;
        }
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
    async hasIndex() {
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
    isDuplicateColumnError(error) {
        const databaseError = error;
        return databaseError.code === 'ER_DUP_FIELDNAME' || databaseError.errno === 1060;
    }
    isDuplicateIndexError(error) {
        const databaseError = error;
        return databaseError.code === 'ER_DUP_KEYNAME' || databaseError.errno === 1061;
    }
    isMissingColumnError(error) {
        const databaseError = error;
        return databaseError.code === 'ER_CANT_DROP_FIELD_OR_KEY' || databaseError.errno === 1091;
    }
}
exports.default = default_1;
//# sourceMappingURL=1786480000000_indeximage_ocr_checks_add_line_marker.js.map