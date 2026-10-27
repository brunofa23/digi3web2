"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'indeximage_ocr_checks';
    }
    async up() {
        for (const column of ['detected_side', 'side_confidence', 'side_evidence', 'side_processed_at']) {
            if (await this.schema.hasColumn(this.tableName, column))
                continue;
            try {
                await this.schema.alterTable(this.tableName, (table) => {
                    if (column === 'detected_side')
                        table.string(column, 1).nullable().after('processed_at');
                    if (column === 'side_confidence')
                        table.decimal(column, 5, 4).nullable().after('detected_side');
                    if (column === 'side_evidence')
                        table.string(column, 120).nullable().after('side_confidence');
                    if (column === 'side_processed_at')
                        table.timestamp(column, { useTz: true }).nullable().after('side_evidence');
                });
            }
            catch (error) {
                const databaseError = error;
                if (databaseError.code !== 'ER_DUP_FIELDNAME' && databaseError.errno !== 1060)
                    throw error;
            }
        }
    }
    async down() {
    }
}
exports.default = default_1;
//# sourceMappingURL=1793000000001_indeximage_ocr_checks_add_side_detection.js.map