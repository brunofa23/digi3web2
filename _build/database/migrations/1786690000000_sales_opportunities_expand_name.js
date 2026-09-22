"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    async up() {
        this.schema.alterTable('sales_opportunities', (table) => {
            table.string('name', 255).notNullable().alter();
        });
    }
    async down() {
        this.schema.alterTable('sales_opportunities', (table) => {
            table.string('name', 120).notNullable().alter();
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1786690000000_sales_opportunities_expand_name.js.map