import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'books'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('description', 100).after('name')
      table.boolean('ordercertificate').defaultTo(false).after('status')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('description')
      table.dropColumn('ordercertificate')
    })
  }
}
