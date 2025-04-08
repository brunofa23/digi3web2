import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_accounts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.datetime('date').after('fin_paymentmethod_id')
      table.dateTime('date_due').after('date') 
      table.boolean('replicate').after('cost')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('fin_paymentmethod_id')
    })
  }
}
