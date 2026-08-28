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
        const hasSide = await this.hasColumn('side');
        if (hasSide)
            return;
        try {
            await this.schema.alterTable(this.tableName, (table) => {
                table.string('side', 5).nullable().after('sheet');
            });
        }
        catch (error) {
            if (!this.isDuplicateColumnError(error))
                throw error;
        }
    }
    async down() {
        const hasSide = await this.hasColumn('side');
        if (!hasSide)
            return;
        await this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('side');
        });
    }
    async hasColumn(columnName) {
        return this.schema.hasColumn(this.tableName, columnName);
    }
    isDuplicateColumnError(error) {
        const databaseError = error;
        const message = databaseError.sqlMessage || databaseError.message || '';
        return databaseError.code === 'ER_DUP_FIELDNAME'
            || databaseError.errno === 1060
            || message.includes('Duplicate column name');
    }
}
exports.default = default_1;
//# sourceMappingURL=1786500000004_indeximages_add_side.js.map