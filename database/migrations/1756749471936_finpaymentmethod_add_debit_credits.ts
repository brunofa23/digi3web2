import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_payment_methods'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('debit_credit', 2).nullable().after('limit_amount')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('debit_credit')
    })
  }
}
