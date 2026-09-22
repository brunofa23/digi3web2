"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'secondcopy_certificates';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('typebook_id').nullable().unsigned().references('id').inTable('typebooks').onUpdate('RESTRICT').onDelete('RESTRICT').after('registered1');
            table.string('term1').nullable().after('sheet1');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('typebook_id');
            table.dropColumn('term1');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1770722019255_secondcopy_certificate_add_typebook_id_and_terms.js.map