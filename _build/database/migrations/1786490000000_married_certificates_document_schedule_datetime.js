"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class MarriedCertificatesDocumentScheduleDatetime extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'married_certificates';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dateTime('document_schedule_date').nullable().alter();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.date('document_schedule_date').nullable().alter();
        });
    }
}
exports.default = MarriedCertificatesDocumentScheduleDatetime;
//# sourceMappingURL=1786490000000_married_certificates_document_schedule_datetime.js.map