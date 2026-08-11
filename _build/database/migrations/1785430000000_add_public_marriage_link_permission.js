"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.permissiongroupId = 42;
    }
    async up() {
        this.defer(async (db) => {
            const exists = await db
                .from('permissiongroups')
                .where('id', this.permissiongroupId)
                .first();
            if (!exists) {
                await db.table('permissiongroups').insert({
                    id: this.permissiongroupId,
                    name: 'Link público de casamento',
                    desc: 'Permite gerenciar o link público de solicitação de casamento.',
                    inactive: false,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
            }
            const digi3Group = await db
                .from('usergroups')
                .where('id', 1)
                .first();
            if (!digi3Group)
                return;
            const linked = await db
                .from('groupxpermissions')
                .where('usergroup_id', 1)
                .where('permissiongroup_id', this.permissiongroupId)
                .first();
            if (linked)
                return;
            await db.table('groupxpermissions').insert({
                usergroup_id: 1,
                permissiongroup_id: this.permissiongroupId,
                created_at: new Date(),
                updated_at: new Date(),
            });
        });
    }
    async down() {
        this.defer(async (db) => {
            await db
                .from('groupxpermissions')
                .where('permissiongroup_id', this.permissiongroupId)
                .delete();
            await db
                .from('permissiongroups')
                .where('id', this.permissiongroupId)
                .delete();
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1785430000000_add_public_marriage_link_permission.js.map