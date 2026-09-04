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
            table
                .integer('born_certificate_id')
                .unsigned()
                .nullable()
                .references('id')
                .inTable('born_certificates')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT')
                .after('married_certificate_id');
            table.index(['companies_id', 'born_certificate_id'], 'idx_imgcert_comp_born');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropIndex(['companies_id', 'born_certificate_id'], 'idx_imgcert_comp_born');
            table.dropColumn('born_certificate_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1786620000001_image_certificates_add_born_certificate_id.js.map