"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.permissiongroupId = 48;
    }
    async up() {
        this.defer(async (db) => {
            const now = new Date();
            const permission = await db.from('permissiongroups').where('id', this.permissiongroupId).first();
            if (permission && permission.name !== 'Cancelamento de recibo') {
                throw new Error('O ID 48 já pertence a outra permissão.');
            }
            if (!permission) {
                await db.table('permissiongroups').insert({
                    id: this.permissiongroupId,
                    name: 'Cancelamento de recibo',
                    desc: 'Permite autorizar o cancelamento completo de recibos.',
                    inactive: false,
                    created_at: now,
                    updated_at: now,
                });
            }
            const adminGroup = await db.from('usergroups').where('id', 1).first();
            if (!adminGroup)
                return;
            const linked = await db.from('groupxpermissions')
                .where('usergroup_id', 1).where('permissiongroup_id', this.permissiongroupId).first();
            if (!linked) {
                await db.table('groupxpermissions').insert({
                    usergroup_id: 1,
                    permissiongroup_id: this.permissiongroupId,
                    companies_id: null,
                    created_at: now,
                    updated_at: now,
                });
            }
        });
    }
    async down() {
        this.defer(async (db) => {
            await db.from('groupxpermissions').where('permissiongroup_id', this.permissiongroupId).delete();
            await db.from('permissiongroups').where('id', this.permissiongroupId).delete();
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1791158400000_receipt_cancellation_permission.js.map