"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    async up() {
        this.schema.raw('ALTER TABLE receipt_payments ADD COLUMN canceled_at DATETIME NULL AFTER received_by');
    }
    async down() {
        this.schema.alterTable('receipt_payments', (table) => table.dropColumn('canceled_at'));
    }
}
exports.default = default_1;
//# sourceMappingURL=1790985600000_receipt_payment_cancellation.js.map