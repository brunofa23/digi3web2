import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fiscal_invoice_events'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.integer('fiscal_invoice_id').nullable().unsigned().references('id').inTable('fiscal_invoices').onUpdate('RESTRICT').onDelete('SET NULL')
      table.string('event', 60).notNullable()
      table.string('old_status', 30).nullable()
      table.string('new_status', 30).nullable()
      table.text('message').nullable()
      table.json('payload_json').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.index(['companies_id', 'fiscal_invoice_id'])
      table.index(['companies_id', 'created_at'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
