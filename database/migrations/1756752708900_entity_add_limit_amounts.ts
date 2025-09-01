import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_entities'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('limit_amount',10,2).after('phone')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('limit_amount')
    })
  }
}
