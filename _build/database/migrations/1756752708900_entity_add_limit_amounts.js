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
            table.decimal('limit_amount', 10, 2).after('phone');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, table => {
            table.dropColumn('limit_amount');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1756752708900_entity_add_limit_amounts.js.map