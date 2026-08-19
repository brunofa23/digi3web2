"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'indeximages';
    }
    async dropColumnIfExists(columnName) {
        const hasColumn = await this.schema.hasColumn(this.tableName, columnName);
        if (!hasColumn)
            return;
        await this.schema.raw(`
      ALTER TABLE \`${this.tableName}\`
      DROP COLUMN \`${columnName}\`,
      ALGORITHM=INSTANT,
      LOCK=NONE
    `);
    }
    async up() {
        await this.dropColumnIfExists('name');
        await this.dropColumnIfExists('cpf');
        await this.dropColumnIfExists('index_text');
    }
    async down() { }
}
exports.default = default_1;
//# sourceMappingURL=1786470000000_indeximages_drop_legacy_ocr_fields.js.map