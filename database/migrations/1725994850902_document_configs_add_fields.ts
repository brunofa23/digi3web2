import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'document_configs'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('documenttype_id').after('yeardoc')
      table.string('free').after('documenttype_id')
      table.string('book_name').after('free')
      table.string('book_number').after('book_name')
      table.string('sheet_number').after('book_number')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Reverter as alterações feitas no método "up"
      table.dropColumn('documenttype_id')
      table.dropColumn('free')
      table.dropColumn('book_name')
      table.dropColumn('book_number')
      table.dropColumn('sheet_number')
    })
  }

}
