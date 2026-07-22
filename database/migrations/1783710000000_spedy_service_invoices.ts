import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class SpedyServiceInvoices extends BaseSchema {
  protected tableName = 'spedy_service_invoices'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').unsigned().notNullable().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.integer('receipt_id').unsigned().nullable().references('id').inTable('receipts').onUpdate('RESTRICT').onDelete('SET NULL')
      table.string('environment', 20).notNullable().defaultTo('sandbox')
      table.uuid('spedy_company_id').nullable()
      table.uuid('spedy_invoice_id').nullable()
      table.string('integration_id', 36).notNullable()
      table.string('status', 40).nullable()
      table.string('number', 40).nullable()
      table.decimal('amount', 15, 2).notNullable().defaultTo(0)
      table.string('receiver_name', 120).nullable()
      table.string('receiver_federal_tax_number', 20).nullable()
      table.text('description').nullable()
      table.dateTime('effective_date').nullable()
      table.json('request_payload').nullable()
      table.json('response_payload').nullable()
      table.json('processing_detail').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['companies_id', 'integration_id'], 'uniq_spedy_nfse_company_integration')
      table.index(['companies_id', 'status'])
      table.index(['spedy_invoice_id'])
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
