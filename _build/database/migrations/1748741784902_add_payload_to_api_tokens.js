"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'api_tokens';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.json('payload').nullable();
        });
    }
    async down() {
        this.schema.alterTable('api_tokens', (table) => {
            table.dropColumn('payload');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1748741784902_add_payload_to_api_tokens.js.map