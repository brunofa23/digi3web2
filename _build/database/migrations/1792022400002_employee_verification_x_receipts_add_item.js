"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
class EmployeeVerificationXReceiptsAddItem extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'employee_verification_x_receipts';
        this.indexName = 'uniq_empver_x_rec_item_sequence';
        this.columnMarker = 'digi3_order_sequence_migration_1792022400002';
    }
    async up() {
        if (!(await this.hasColumn())) {
            await Database_1.default.rawQuery(`
        ALTER TABLE employee_verification_x_receipts
        ADD COLUMN item INT UNSIGNED NULL COMMENT '${this.columnMarker}' AFTER date
      `);
            await Database_1.default.rawQuery(`
        UPDATE employee_verification_x_receipts AS target
        JOIN (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY receipt_id ORDER BY date, id) AS sequence_number
          FROM employee_verification_x_receipts
        ) AS ordered ON ordered.id = target.id
        SET target.item = ordered.sequence_number
      `);
            await Database_1.default.rawQuery(`
        ALTER TABLE employee_verification_x_receipts
        MODIFY item INT UNSIGNED NOT NULL COMMENT '${this.columnMarker}'
      `);
        }
        if (!(await this.hasIndex('uniq_empver_x_rec_item')) && !(await this.hasIndex(this.indexName))) {
            await Database_1.default.rawQuery(`
        ALTER TABLE employee_verification_x_receipts
        ADD UNIQUE INDEX ${this.indexName} (receipt_id, item)
      `);
        }
    }
    async down() {
        if (await this.hasIndex(this.indexName)) {
            await Database_1.default.rawQuery(`
        ALTER TABLE employee_verification_x_receipts DROP INDEX ${this.indexName}
      `);
        }
        const result = await Database_1.default.rawQuery('SELECT COLUMN_COMMENT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?', [this.tableName, 'item']);
        if (result[0][0]?.COLUMN_COMMENT === this.columnMarker) {
            await Database_1.default.rawQuery('ALTER TABLE employee_verification_x_receipts DROP COLUMN item');
        }
    }
    async hasColumn() {
        const result = await Database_1.default.rawQuery('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1', [this.tableName, 'item']);
        return result[0].length > 0;
    }
    async hasIndex(indexName) {
        const result = await Database_1.default.rawQuery('SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1', [this.tableName, indexName]);
        return result[0].length > 0;
    }
}
exports.default = EmployeeVerificationXReceiptsAddItem;
EmployeeVerificationXReceiptsAddItem.disableTransactions = true;
//# sourceMappingURL=1792022400002_employee_verification_x_receipts_add_item.js.map