import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('order_certificate_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('order_certificates')
        .onUpdate('RESTRICT')
        .onDelete('SET NULL')

      table.unique(['order_certificate_id'], 'uq_documents_order_certificate_id')
      table.index(['companies_id', 'order_certificate_id'], 'idx_documents_company_order_certificate')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['order_certificate_id'], 'uq_documents_order_certificate_id')
      table.dropIndex(['companies_id', 'order_certificate_id'], 'idx_documents_company_order_certificate')
      table.dropColumn('order_certificate_id')
    })
  }
}
