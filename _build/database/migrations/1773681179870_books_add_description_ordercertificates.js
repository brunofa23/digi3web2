"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'books';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('description', 100).after('name');
            table.boolean('ordercertificate').defaultTo(false).after('status');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('description');
            table.dropColumn('ordercertificate');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1773681179870_books_add_description_ordercertificates.js.map