"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.permissiongroupId = 46;
    }
    async up() {
        this.defer(async (db) => {
            const now = new Date();
            const exists = await db.from('permissiongroups').where('id', this.permissiongroupId).first();
            if (!exists) {
                await db.table('permissiongroups').insert({
                    id: this.permissiongroupId,
                    name: 'Exclusão de imagens do Google Drive',
                    desc: 'Permite excluir fisicamente imagens do Google Drive pela exclusão em lotes.',
                    inactive: false,
                    created_at: now,
                    updated_at: now,
                });
            }
            const linked = await db.from('groupxpermissions')
                .where('usergroup_id', 1)
                .where('permissiongroup_id', this.permissiongroupId)
                .first();
            if (!linked) {
                await db.table('groupxpermissions').insert({
                    usergroup_id: 1,
                    permissiongroup_id: this.permissiongroupId,
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
//# sourceMappingURL=1786650000001_drive_deletion_permission.js.map