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
            table.integer('death_certificate_id').unsigned().nullable()
                .references('id').inTable('death_certificates').onDelete('RESTRICT')
                .after('born_certificate_id');
            table.index(['companies_id', 'death_certificate_id'], 'idx_imgcert_comp_death');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropIndex(['companies_id', 'death_certificate_id'], 'idx_imgcert_comp_death');
            table.dropColumn('death_certificate_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1792630000001_image_certificates_add_death_certificate_id.js.map