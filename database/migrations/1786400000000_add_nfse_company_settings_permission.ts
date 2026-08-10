import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  private serviceInvoicePermissiongroupId = 41
  private companyNfseSettingsPermissiongroupId = 43

  public async up () {
    this.defer(async (db) => {
      const now = new Date()

      await db
        .from('permissiongroups')
        .where('id', this.serviceInvoicePermissiongroupId)
        .update({
          name: 'Emissão de NFS-e',
          desc: 'Permite acesso a tela de emissao de NFS-e.',
          updated_at: now,
        })

      const exists = await db
        .from('permissiongroups')
        .where('id', this.companyNfseSettingsPermissiongroupId)
        .first()

      if (!exists) {
        await db.table('permissiongroups').insert({
          id: this.companyNfseSettingsPermissiongroupId,
          name: 'Acesso cadastro de empresa para nota fiscal Spedy',
          desc: 'Permite acessar somente as configuracoes de NFS-e no cadastro da propria empresa.',
          inactive: false,
          created_at: now,
          updated_at: now,
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
        .where('permissiongroup_id', this.companyNfseSettingsPermissiongroupId)
        .first()

      if (linked) return

      await db.table('groupxpermissions').insert({
        usergroup_id: 1,
        permissiongroup_id: this.companyNfseSettingsPermissiongroupId,
        created_at: now,
        updated_at: now,
      })
    })
  }

  public async down () {
    this.defer(async (db) => {
      await db
        .from('groupxpermissions')
        .where('permissiongroup_id', this.companyNfseSettingsPermissiongroupId)
        .delete()

      await db
        .from('permissiongroups')
        .where('id', this.companyNfseSettingsPermissiongroupId)
        .delete()

      await db
        .from('permissiongroups')
        .where('id', this.serviceInvoicePermissiongroupId)
        .update({
          name: 'NFS-e Spedy',
          desc: 'Permite acesso a tela de emissao de NFS-e pela Spedy.',
          updated_at: new Date(),
        })
    })
  }
}
