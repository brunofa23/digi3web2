"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'fin_accounts';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('entity_id').nullable()
                .unsigned().references('id')
                .inTable('fin_entities')
                .onUpdate('CASCADE').after('id_replication');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, table => {
            table.dropColumn('entity_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1751648796133_fin_account_add_entities.js.map