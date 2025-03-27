import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_accounts'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('payment_method',15).nullable().after('debit_credit')
      table.string('cost',10).nullable().after('debit_credit')
      table.boolean('ir').defaultTo(false).after('debit_credit')
      table.string('obs',255).nullable().after('debit_credit')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      // Reverter as alterações feitas no método "up"
      table.dropColumn('payment_method')
      table.dropColumn('cost')
      table.dropColumn('ir')
      table.dropColumn('obs')
    })
  }
}
