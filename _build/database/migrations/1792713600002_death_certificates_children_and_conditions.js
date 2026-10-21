"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'death_certificates';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.boolean('other_significant_conditions').notNullable().defaultTo(true).after('status_form');
            table.boolean('left_assets').nullable().after('other_significant_conditions');
            table.boolean('left_children').nullable().after('left_assets');
            table.boolean('left_will').nullable().after('left_children');
            table.boolean('minor_heirs').nullable().after('left_will');
            table.boolean('interdicted_heirs').nullable().after('minor_heirs');
            table.json('death_children').nullable().after('interdicted_heirs');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('other_significant_conditions');
            table.dropColumn('left_assets');
            table.dropColumn('left_children');
            table.dropColumn('left_will');
            table.dropColumn('minor_heirs');
            table.dropColumn('interdicted_heirs');
            table.dropColumn('death_children');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1792713600002_death_certificates_children_and_conditions.js.map