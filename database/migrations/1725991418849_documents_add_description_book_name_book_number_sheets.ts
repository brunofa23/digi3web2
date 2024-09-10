import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('documenttype_id').nullable().unsigned().references('documenttypes.id').onDelete('CASCADE').onUpdate('CASCADE')
      table.boolean('free').nullable()
      table.string('book_name').nullable()
      table.integer('book_number').nullable()
      table.integer('sheet_number').nullable()
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
