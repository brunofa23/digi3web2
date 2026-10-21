"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'death_certificates';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.boolean('burial_witnesses_enabled').notNullable().defaultTo(false).after('burial_witnesses');
            table.string('burial_witness1_name', 90).nullable().after('burial_witnesses_enabled');
            table.string('burial_witness1_document_type', 50).nullable().after('burial_witness1_name');
            table.string('burial_witness1_document_number', 30).nullable().after('burial_witness1_document_type');
            table.string('burial_witness2_name', 90).nullable().after('burial_witness1_document_number');
            table.string('burial_witness2_document_type', 50).nullable().after('burial_witness2_name');
            table.string('burial_witness2_document_number', 30).nullable().after('burial_witness2_document_type');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('burial_witnesses_enabled');
            table.dropColumn('burial_witness1_name');
            table.dropColumn('burial_witness1_document_type');
            table.dropColumn('burial_witness1_document_number');
            table.dropColumn('burial_witness2_name');
            table.dropColumn('burial_witness2_document_type');
            table.dropColumn('burial_witness2_document_number');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1792713600001_death_certificates_burial_witness_details.js.map