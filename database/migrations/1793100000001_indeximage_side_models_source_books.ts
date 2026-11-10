import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximage_side_models'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('source_books').nullable().after('book')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('source_books')
    })
  }
}
