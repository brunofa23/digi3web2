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
    }
    async up() {
        const hasImageOrigin = await this.hasColumn('image_origin');
        const hasImageWidth = await this.hasColumn('image_width');
        const hasImageHeight = await this.hasColumn('image_height');
        if (hasImageOrigin && hasImageWidth && hasImageHeight)
            return;
        await this.schema.alterTable(this.tableName, (table) => {
            if (!hasImageOrigin)
                table.string('image_origin', 50).nullable().after('drive_folder_id');
            if (!hasImageWidth)
                table.integer('image_width').unsigned().nullable().after('image_origin');
            if (!hasImageHeight)
                table.integer('image_height').unsigned().nullable().after('image_width');
        });
    }
    async down() {
        const hasImageHeight = await this.hasColumn('image_height');
        const hasImageWidth = await this.hasColumn('image_width');
        const hasImageOrigin = await this.hasColumn('image_origin');
        if (!hasImageHeight && !hasImageWidth && !hasImageOrigin)
            return;
        await this.schema.alterTable(this.tableName, (table) => {
            if (hasImageHeight)
                table.dropColumn('image_height');
            if (hasImageWidth)
                table.dropColumn('image_width');
            if (hasImageOrigin)
                table.dropColumn('image_origin');
        });
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
}
exports.default = default_1;
//# sourceMappingURL=1786500000003_indeximages_add_image_traceability.js.map