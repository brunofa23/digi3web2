import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'averbation_descriptions'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('book_id').unsigned().nullable().references('id').inTable('books').onDelete('RESTRICT')
      table.index(['companies_id', 'book_id'], 'averbation_descriptions_company_book_idx')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['companies_id', 'book_id'], 'averbation_descriptions_company_book_idx')
      table.dropColumn('book_id')
    })
  }
}
