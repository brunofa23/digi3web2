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
        this.tableName = 'companies';
    }
    async up() {
        const hasUploadLimitColumn = await this.schema.hasColumn(this.tableName, 'max_upload_size_mb');
        if (!hasUploadLimitColumn) {
            await this.schema.alterTable(this.tableName, (table) => {
                table.integer('max_upload_size_mb').nullable().defaultTo(10);
            });
        }
        await Database_1.default.from(this.tableName)
            .whereNull('max_upload_size_mb')
            .orWhere('max_upload_size_mb', 0)
            .update({ max_upload_size_mb: 10 });
    }
    async down() {
        const hasUploadLimitColumn = await this.schema.hasColumn(this.tableName, 'max_upload_size_mb');
        if (hasUploadLimitColumn) {
            await this.schema.alterTable(this.tableName, (table) => {
                table.dropColumn('max_upload_size_mb');
            });
        }
    }
}
exports.default = default_1;
//# sourceMappingURL=1786630000000_companies_add_upload_limit.js.map