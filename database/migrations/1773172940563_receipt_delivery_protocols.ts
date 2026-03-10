import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'receipts'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('delivery_name',100).nullable().after('habilitation_proccess')
      table.dateTime('delivery_date').nullable().after('delivery_name')
      table.string('tracking_cod',50).nullable().after('delivery_date')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('delivery_name')
      table.dropColumn('delivery_date')
      table.dropColumn('tracking_cod')
    })
  }
}
