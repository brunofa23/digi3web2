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
        for (const column of ['book', 'sheet', 'side']) {
            await this.dropColumnIfExists(column);
        }
    }
    async down() {
        if (!(await this.hasColumn('book'))) {
            await this.schema.alterTable(this.tableName, (table) => {
                table.integer('book').nullable().after('previous_file_name');
            });
        }
        if (!(await this.hasColumn('sheet'))) {
            await this.schema.alterTable(this.tableName, (table) => {
                table.integer('sheet').nullable().after('book');
            });
        }
        if (!(await this.hasColumn('side'))) {
            await this.schema.alterTable(this.tableName, (table) => {
                table.string('side', 5).nullable().after('sheet');
            });
        }
    }
    async dropColumnIfExists(columnName) {
        if (!(await this.hasColumn(columnName)))
            return;
        try {
            await this.schema.alterTable(this.tableName, (table) => {
                table.dropColumn(columnName);
            });
        }
        catch (error) {
            if (!this.isMissingColumnError(error))
                throw error;
        }
    }
    async hasColumn(columnName) {
        return this.schema.hasColumn(this.tableName, columnName);
    }
    isMissingColumnError(error) {
        const databaseError = error;
        const message = databaseError.sqlMessage || databaseError.message || '';
        return databaseError.code === 'ER_CANT_DROP_FIELD_OR_KEY'
            || databaseError.errno === 1091
            || message.includes("Can't DROP");
    }
}
exports.default = default_1;
//# sourceMappingURL=1786500000005_indeximages_remove_book_sheet_side.js.map