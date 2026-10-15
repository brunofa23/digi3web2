"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'order_certificates';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.boolean('inactive').notNullable().defaultTo(false).after('certificate_id');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('inactive');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1792022400003_order_certificates_add_inactive.js.map