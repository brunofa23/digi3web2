import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_accounts'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('debit_credit',2).notNullable().after('excluded')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      // Reverter as alterações feitas no método "up"
      table.dropColumn('debit_credit')
    })
  }
}
