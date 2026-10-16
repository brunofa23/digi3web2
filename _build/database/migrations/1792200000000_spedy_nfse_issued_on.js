"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'spedy_service_invoices';
    }
    async up() {
        this.defer(async (db) => {
            if (!await db.schema.hasColumn(this.tableName, 'issued_on')) {
                await db.schema.alterTable(this.tableName, (table) => {
                    table.dateTime('issued_on').nullable().after('processing_history');
                });
            }
            const [indexes] = await db.rawQuery(`
        SELECT INDEX_NAME FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
      `, [this.tableName, 'idx_spedy_nfse_company_issued_on']);
            if (!indexes.length) {
                await db.schema.alterTable(this.tableName, (table) => {
                    table.index(['companies_id', 'issued_on'], 'idx_spedy_nfse_company_issued_on');
                });
            }
            await db.rawQuery(`
      UPDATE spedy_service_invoices
      SET issued_on = STR_TO_DATE(SUBSTRING(JSON_UNQUOTE(JSON_EXTRACT(response_payload, '$.issuedOn')), 1, 19), '%Y-%m-%dT%H:%i:%s')
      WHERE issued_on IS NULL AND JSON_VALID(response_payload)
        AND JSON_UNQUOTE(JSON_EXTRACT(response_payload, '$.issuedOn')) REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}'
      `);
        });
    }
    async down() {
        this.defer(async (db) => {
            const [indexes] = await db.rawQuery(`
        SELECT INDEX_NAME FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
      `, [this.tableName, 'idx_spedy_nfse_company_issued_on']);
            if (indexes.length) {
                await db.schema.alterTable(this.tableName, (table) => {
                    table.dropIndex(['companies_id', 'issued_on'], 'idx_spedy_nfse_company_issued_on');
                });
            }
            if (await db.schema.hasColumn(this.tableName, 'issued_on')) {
                await db.schema.alterTable(this.tableName, (table) => {
                    table.dropColumn('issued_on');
                });
            }
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1792200000000_spedy_nfse_issued_on.js.map