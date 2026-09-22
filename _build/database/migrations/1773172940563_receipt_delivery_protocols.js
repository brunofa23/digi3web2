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
            table.string('delivery_name', 100).nullable().after('habilitation_proccess');
            table.string('delivery_cpf', 11).nullable().after('delivery_name');
            table.dateTime('delivery_date').nullable().after('delivery_cpf');
            table.string('tracking_cod', 50).nullable().after('delivery_date');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('delivery_name');
            table.dropColumn('delivery_date');
            table.dropColumn('tracking_cod');
            table.dropColumn('delivery_cpf');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1773172940563_receipt_delivery_protocols.js.map