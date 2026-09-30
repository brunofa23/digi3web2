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
        await this.schema.alterTable(this.tableName, (table) => {
            table.dropIndex('obs');
        });
        await this.schema.alterTable(this.tableName, (table) => {
            table.text('stringfield1').alter();
            table.text('obs').nullable().alter();
        });
        await this.schema.raw('CREATE INDEX `documents_obs_index` ON `documents` (`obs`(191))');
    }
    async down() {
        await this.schema.alterTable(this.tableName, (table) => {
            table.dropIndex('obs');
        });
        await this.schema.alterTable(this.tableName, (table) => {
            table.string('stringfield1', 350).alter();
            table.string('obs', 350).nullable().alter();
        });
        await this.schema.alterTable(this.tableName, (table) => {
            table.index('obs');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1791000000000_documents_alter_stringfield1_obs_to_text.js.map