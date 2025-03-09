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
            table.index('prot');
            table.index('obs');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropIndex('prot');
            table.dropIndex('obs');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1741558072503_documents_add_index_prot_add_obs.js.map