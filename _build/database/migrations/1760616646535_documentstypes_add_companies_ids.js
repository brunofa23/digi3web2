"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'documenttypes';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('companies_id').after('id').notNullable().unsigned().references('id').inTable('companies').onUpdate('CASCADE').defaultTo(1);
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('companies_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1760616646535_documentstypes_add_companies_ids.js.map