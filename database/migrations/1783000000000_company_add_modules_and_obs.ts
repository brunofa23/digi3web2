import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'companies'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('module_books').defaultTo(false)
      table.boolean('module_financial').defaultTo(false)
      table.boolean('module_lgpd').defaultTo(false)
      table.string('obs', 255).nullable()
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('module_books')
      table.dropColumn('module_financial')
      table.dropColumn('module_lgpd')
      table.dropColumn('obs')
    })
  }
}
