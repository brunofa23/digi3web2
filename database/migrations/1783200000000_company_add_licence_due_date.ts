import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'companies'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('licence_value', 10, 2).nullable()
      table.integer('due_date').nullable()
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('licence_value')
      table.dropColumn('due_date')
    })
  }
}
