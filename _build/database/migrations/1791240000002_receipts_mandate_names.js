"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
class default_1 extends Schema_1.default {
    async up() {
        this.schema.alterTable('receipts', (table) => {
            table.string('applicant', 100).nullable().alter();
            table.string('registered1', 255).nullable().alter();
        });
    }
    async down() {
        const longerName = await Database_1.default.from('receipts')
            .whereRaw('CHAR_LENGTH(applicant) > 90 OR CHAR_LENGTH(registered1) > 90')
            .first();
        if (longerName)
            throw new Error('Há recibos com nomes acima de 90 caracteres; a reversão truncaria dados');
        this.schema.alterTable('receipts', (table) => {
            table.string('applicant', 90).nullable().alter();
            table.string('registered1', 90).nullable().alter();
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1791240000002_receipts_mandate_names.js.map