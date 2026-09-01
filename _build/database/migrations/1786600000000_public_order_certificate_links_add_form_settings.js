"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'public_order_certificate_links';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.json('form_settings').nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('form_settings');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1786600000000_public_order_certificate_links_add_form_settings.js.map