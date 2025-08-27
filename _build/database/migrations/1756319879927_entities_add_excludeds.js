"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'fin_entities';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.boolean('excluded').defaultTo(false).after('inactive');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, table => {
            table.dropColumn('excluded');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1756319879927_entities_add_excludeds.js.map