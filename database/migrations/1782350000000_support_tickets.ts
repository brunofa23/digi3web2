import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'support_tickets'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.integer('users_id').notNullable().unsigned().references('id').inTable('users').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.integer('assigned_users_id').nullable().unsigned().references('id').inTable('users').onUpdate('RESTRICT').onDelete('SET NULL')
      table.string('request_type', 30).notNullable()
      table.string('status', 30).notNullable().defaultTo('aberto')
      table.text('description').notNullable()
      table.timestamp('opened_at', { useTz: true }).notNullable()
      table.timestamp('resolved_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      table.index(['companies_id', 'status'], 'support_tickets_company_status_idx')
      table.index(['companies_id', 'request_type'], 'support_tickets_company_type_idx')
      table.index(['companies_id', 'opened_at'], 'support_tickets_company_opened_idx')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
