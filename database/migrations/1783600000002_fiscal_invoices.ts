import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fiscal_invoices'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.integer('receipt_id').nullable().unsigned().references('id').inTable('receipts').onUpdate('RESTRICT').onDelete('SET NULL')
      table.string('source_type', 20).notNullable()
      table.string('provider', 20).notNullable().defaultTo('spedy')
      table.string('model', 30).notNullable().defaultTo('serviceInvoice')
      table.string('integration_id', 80).notNullable()
      table.string('spedy_invoice_id', 60).nullable()
      table.string('status', 30).notNullable().defaultTo('created')
      table.string('number', 30).nullable()
      table.string('series', 20).nullable()
      table.string('rps_number', 30).nullable()
      table.decimal('amount', 12, 2).notNullable().defaultTo(0)
      table.text('description').nullable()
      table.string('receiver_name', 120).nullable()
      table.string('receiver_document', 20).nullable()
      table.string('receiver_email', 120).nullable()
      table.string('processing_status', 30).nullable()
      table.string('processing_code', 40).nullable()
      table.text('processing_message').nullable()
      table.json('payload_json').nullable()
      table.json('response_json').nullable()
      table.timestamp('issued_at', { useTz: true }).nullable()
      table.timestamp('canceled_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['companies_id', 'integration_id'])
      table.index(['companies_id', 'status'])
      table.index(['companies_id', 'receipt_id'])
      table.index(['spedy_invoice_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
