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
    async up() {
        const hasName = await this.schema.hasColumn(this.tableName, 'name');
        const hasCpf = await this.schema.hasColumn(this.tableName, 'cpf');
        const hasIndexText = await this.schema.hasColumn(this.tableName, 'index_text');
        if (!hasName && !hasCpf && !hasIndexText)
            return;
        await this.schema.alterTable(this.tableName, (table) => {
            if (hasName)
                table.dropColumn('name');
            if (hasCpf)
                table.dropColumn('cpf');
            if (hasIndexText)
                table.dropColumn('index_text');
        });
    }
    async down() { }
}
exports.default = default_1;
//# sourceMappingURL=1786470000000_indeximages_drop_legacy_ocr_fields.js.map