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
            table
                .integer('fin_class_id')
                .nullable()
                .unsigned()
                .references('id')
                .inTable('fin_classes')
                .onUpdate('CASCADE')
                .onDelete('SET NULL')
                .after('companies_id');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropForeign(['fin_class_id']);
            table.dropColumn('fin_class_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1782360000000_fin_entities_add_fin_class.js.map