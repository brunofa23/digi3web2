"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'typebooks';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('totalfiles').nullable();
            table.datetime('dateindex').nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('totalfiles');
            table.dropColumn('dateindex');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1698270051745_typebook_add_dateindex_qtdeimages.js.map