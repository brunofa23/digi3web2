"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    async up() {
        this.defer(async (db) => {
            await db.from('permissiongroups').where('id', 48).update({
                name: 'Cancelamento de recibos e formulários',
                desc: 'Permite autorizar o cancelamento completo de recibos e cancelar formulários por inativação.',
                updated_at: new Date(),
            });
        });
    }
    async down() {
        this.defer(async (db) => {
            await db.from('permissiongroups').where('id', 48).update({
                name: 'Cancelamento de recibo',
                desc: 'Permite autorizar o cancelamento completo de recibos.',
                updated_at: new Date(),
            });
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1792368000000_receipt_cancellation_permission_forms.js.map