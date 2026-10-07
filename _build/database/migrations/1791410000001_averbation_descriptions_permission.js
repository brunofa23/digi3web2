"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.permissiongroupId = 49;
    }
    async up() {
        this.defer(async (db) => {
            const exists = await db.from('permissiongroups').where('id', this.permissiongroupId).first();
            if (exists && exists.name !== 'Descrições de Averbações') {
                throw new Error('O ID 49 já pertence a outra permissão.');
            }
            if (!exists) {
                await db.table('permissiongroups').insert({
                    id: this.permissiongroupId,
                    name: 'Descrições de Averbações',
                    desc: 'Permite consultar e manter descrições de averbações da empresa.',
                    inactive: false,
                    created_at: new Date(),
                    updated_at: new Date(),
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
                    created_at: new Date(),
                    updated_at: new Date(),
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
//# sourceMappingURL=1791410000001_averbation_descriptions_permission.js.map