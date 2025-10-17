"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'documents';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('fin_entities_id').nullable().unsigned()
                .after('companies_id').references('fin_entities.id')
                .onDelete('CASCADE').onUpdate('CASCADE');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('fin_entities_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1760641729650_documents_add_entities.js.map