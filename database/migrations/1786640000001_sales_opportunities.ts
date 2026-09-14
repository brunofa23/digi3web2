import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'sales_opportunities'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('company_id').unsigned().nullable().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('SET NULL')
      table.integer('sales_stage_id').unsigned().notNullable().references('id').inTable('sales_stages').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.string('name', 120).notNullable()
      table.string('city', 100).nullable()
      table.string('contact_name', 120).nullable()
      table.string('phone', 30).nullable()
      table.string('interest', 255).nullable()
      table.text('notes').nullable()
      table.date('last_contact_date').nullable()
      table.date('next_contact_date').nullable()
      table.decimal('proposal_value', 15, 2).nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.index(['sales_stage_id'])
      table.index(['company_id'])
      table.index(['next_contact_date'])
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
