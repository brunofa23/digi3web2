"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'image_certificates';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.text('index_text').nullable();
            table.json('extracted_data').nullable();
            table.boolean('ready').nullable().defaultTo(false);
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('index_text');
            table.dropColumn('extracted_data');
            table.dropColumn('ready');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1783590000002_image_certificates_add_ocr_fields.js.map