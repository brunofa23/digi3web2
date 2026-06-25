"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'receipts';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dateTime('date_protocol').after('date_prevision').nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('date_protocol');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1769536996727_receitp_add_date_protocol_date_sealings.js.map