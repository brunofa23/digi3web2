import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_accounts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
        table.boolean('conciliation').after('data_billing')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('conciliation')
    })
  }
}
