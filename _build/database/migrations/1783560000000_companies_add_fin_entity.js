"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'companies';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('fin_entity_id').nullable().unsigned().references('id').inTable('fin_entities').onUpdate('CASCADE');
            table.unique(['fin_entity_id'], 'companies_fin_entity_id_unique');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropUnique(['fin_entity_id'], 'companies_fin_entity_id_unique');
            table.dropColumn('fin_entity_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1783560000000_companies_add_fin_entity.js.map