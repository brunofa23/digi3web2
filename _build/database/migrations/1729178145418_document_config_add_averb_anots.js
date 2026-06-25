"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'document_configs';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.boolean('averb_anot').nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('averb_anot');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1729178145418_document_config_add_averb_anots.js.map