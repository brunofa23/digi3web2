import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  private permissiongroupId = 46

  public async up () {
    this.defer(async (db) => {
      const now = new Date()
      const exists = await db.from('permissiongroups').where('id', this.permissiongroupId).first()

      if (!exists) {
        await db.table('permissiongroups').insert({
          id: this.permissiongroupId,
          name: 'Exclusão de imagens do Google Drive',
          desc: 'Permite excluir fisicamente imagens do Google Drive pela exclusão em lotes.',
          inactive: false,
          created_at: now,
          updated_at: now,
        })
      }

      const linked = await db.from('groupxpermissions')
        .where('usergroup_id', 1)
        .where('permissiongroup_id', this.permissiongroupId)
        .first()

      if (!linked) {
        await db.table('groupxpermissions').insert({
          usergroup_id: 1,
          permissiongroup_id: this.permissiongroupId,
          created_at: now,
          updated_at: now,
        })
      }
    })
  }

  public async down () {
    this.defer(async (db) => {
      await db.from('groupxpermissions').where('permissiongroup_id', this.permissiongroupId).delete()
      await db.from('permissiongroups').where('id', this.permissiongroupId).delete()
    })
  }
}
