import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'order_certificate_averbations'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('book_number').unsigned().nullable().alter()
      table.integer('sheet_number').unsigned().nullable().alter()
      table.integer('term_number').unsigned().nullable().alter()
      table.integer('averbation_description_id').unsigned().nullable().alter()
      table.integer('document_type_book_id').unsigned().nullable().alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('book_number').unsigned().notNullable().alter()
      table.integer('sheet_number').unsigned().notNullable().alter()
      table.integer('term_number').unsigned().notNullable().alter()
      table.integer('averbation_description_id').unsigned().notNullable().alter()
      table.integer('document_type_book_id').unsigned().notNullable().alter()
    })
  }
}
