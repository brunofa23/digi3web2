import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.defer(async (db) => {
      await db.from('permissiongroups').where('id', 48).update({
        name: 'Cancelamento de recibos e formulários',
        desc: 'Permite autorizar o cancelamento completo de recibos e cancelar formulários por inativação.',
        updated_at: new Date(),
      })
    })
  }

  public async down() {
    this.defer(async (db) => {
      await db.from('permissiongroups').where('id', 48).update({
        name: 'Cancelamento de recibo',
        desc: 'Permite autorizar o cancelamento completo de recibos.',
        updated_at: new Date(),
      })
    })
  }
}
