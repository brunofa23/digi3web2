"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'indeximage_side_models';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.json('source_books').nullable().after('book');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('source_books');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1793100000001_indeximage_side_models_source_books.js.map