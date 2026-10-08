import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'order_certificate_averbations'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').unsigned().notNullable().references('id').inTable('companies').onDelete('RESTRICT')
      table.integer('order_certificate_id').unsigned().notNullable().references('id').inTable('order_certificates').onDelete('CASCADE')
      table.integer('book_number').unsigned().notNullable()
      table.integer('sheet_number').unsigned().notNullable()
      table.integer('term_number').unsigned().notNullable()
      table.integer('averbation_description_id').unsigned().notNullable().references('id').inTable('averbation_descriptions').onDelete('RESTRICT')
      table.integer('document_type_book_id').unsigned().notNullable().references('id').inTable('document_type_books').onDelete('RESTRICT')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.index(['order_certificate_id', 'companies_id'], 'order_cert_averbations_order_company_idx')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
