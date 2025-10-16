import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('document_type_book_id').nullable().unsigned()
      .after('documenttype_id').references('document_type_books.id')
      .onDelete('CASCADE').onUpdate('CASCADE')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('document_type_book_id')
    })
  }
}
