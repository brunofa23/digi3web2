import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  private permissions = [
    { id: 55, name: 'Atendimento', desc: 'Permite acesso ao menu Atendimento.' },
    { id: 56, name: 'Empresas da integração NFS-e', desc: 'Permite acessar e gerenciar empresas da integração NFS-e.' },
  ]

  public async up() {
    this.defer(async (db) => {
      const now = new Date()
      const digi3Group = await db.from('usergroups').where('id', 1).first()

      for (const permission of this.permissions) {
        const existing = await db.from('permissiongroups').where('id', permission.id).first()
        if (existing && existing.name !== permission.name) {
          throw new Error(`O ID ${permission.id} já pertence a outra permissão.`)
        }

        const existingByName = await db.from('permissiongroups').where('name', permission.name).first()
        if (existingByName && Number(existingByName.id) !== permission.id) {
          throw new Error(`A permissão ${permission.name} já existe com o ID ${existingByName.id}.`)
        }

        if (!existing) {
          await db.table('permissiongroups').insert({
            ...permission,
            inactive: false,
            created_at: now,
            updated_at: now,
          })
        }
      }

      if (!digi3Group) return

      // CRM já existe como permissão 47; a configuração NFS-e (43) também já existe.
      for (const permissiongroupId of [43, 47, ...this.permissions.map((permission) => permission.id)]) {
        const linked = await db.from('groupxpermissions')
          .where('usergroup_id', 1)
          .where('permissiongroup_id', permissiongroupId)
          .whereNull('companies_id')
          .first()

        if (!linked) {
          await db.table('groupxpermissions').insert({
            usergroup_id: 1,
            permissiongroup_id: permissiongroupId,
            companies_id: null,
            created_at: now,
            updated_at: now,
          })
        }
      }
    })
  }

  public async down() {
    this.defer(async (db) => {
      const ids = this.permissions.map((permission) => permission.id)
      await db.from('groupxpermissions').whereIn('permissiongroup_id', ids).delete()
      await db.from('permissiongroups').whereIn('id', ids).delete()
    })
  }
}
