import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_payment_methods'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('limit_amount', 10,2).nullable().after('description')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('limit_amount')
    })
  }
}
