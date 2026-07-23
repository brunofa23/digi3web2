import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  private permissiongroupId = 41

  public async up () {
    this.defer(async (db) => {
      const exists = await db
        .from('permissiongroups')
        .where('id', this.permissiongroupId)
        .first()

      if (!exists) {
        await db.table('permissiongroups').insert({
          id: this.permissiongroupId,
          name: 'NFS-e Spedy',
          desc: 'Permite acesso a tela de emissao de NFS-e pela Spedy.',
          inactive: false,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }

      const digi3Group = await db
        .from('usergroups')
        .where('id', 1)
        .first()

      if (!digi3Group) return

      const linked = await db
        .from('groupxpermissions')
        .where('usergroup_id', 1)
        .where('permissiongroup_id', this.permissiongroupId)
        .first()

      if (linked) return

      await db.table('groupxpermissions').insert({
        usergroup_id: 1,
        permissiongroup_id: this.permissiongroupId,
        created_at: new Date(),
        updated_at: new Date(),
      })
    })
  }

  public async down () {
    this.defer(async (db) => {
      await db
        .from('groupxpermissions')
        .where('permissiongroup_id', this.permissiongroupId)
        .delete()

      await db
        .from('permissiongroups')
        .where('id', this.permissiongroupId)
        .delete()
    })
  }
}
