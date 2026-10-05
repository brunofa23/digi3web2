import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  private permissiongroupId = 48

  public async up() {
    this.defer(async (db) => {
      const now = new Date()
      const permission = await db.from('permissiongroups').where('id', this.permissiongroupId).first()
      if (permission && permission.name !== 'Cancelamento de recibo') {
        throw new Error('O ID 48 já pertence a outra permissão.')
      }
      if (!permission) {
        await db.table('permissiongroups').insert({
          id: this.permissiongroupId,
          name: 'Cancelamento de recibo',
          desc: 'Permite autorizar o cancelamento completo de recibos.',
          inactive: false,
          created_at: now,
          updated_at: now,
        })
      }

      const adminGroup = await db.from('usergroups').where('id', 1).first()
      if (!adminGroup) return
      const linked = await db.from('groupxpermissions')
        .where('usergroup_id', 1).where('permissiongroup_id', this.permissiongroupId).first()
      if (!linked) {
        await db.table('groupxpermissions').insert({
          usergroup_id: 1,
          permissiongroup_id: this.permissiongroupId,
          companies_id: null,
          created_at: now,
          updated_at: now,
        })
      }
    })
  }

  public async down() {
    this.defer(async (db) => {
      await db.from('groupxpermissions').where('permissiongroup_id', this.permissiongroupId).delete()
      await db.from('permissiongroups').where('id', this.permissiongroupId).delete()
    })
  }
}
