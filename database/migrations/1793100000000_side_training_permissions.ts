import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  private permissions = [
    { id: 53, name: 'Treinar IA para ler livro', desc: 'Acesso à revisão de imagens e treinamento da IA para leitura de livros.' },
    { id: 54, name: 'Verificar divergências do livro', desc: 'Acesso à verificação de divergências do treinamento de lados do livro.' },
  ]

  public async up() {
    this.defer(async (db) => {
      const now = new Date()
      const adminGroup = await db.from('usergroups').where('id', 1).first()

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
        if (!adminGroup) continue
        const linked = await db.from('groupxpermissions')
          .where('usergroup_id', 1).where('permissiongroup_id', permission.id).first()
        if (!linked) {
          await db.table('groupxpermissions').insert({
            usergroup_id: 1,
            permissiongroup_id: permission.id,
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
