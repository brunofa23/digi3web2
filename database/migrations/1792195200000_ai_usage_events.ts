import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'ai_usage_events'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').unsigned().notNullable().index()
      table.integer('user_id').unsigned().notNullable()
      table.string('use_case', 80).notNullable().index()
      table.string('provider', 40).notNullable()
      table.string('model', 80).notNullable()
      table.string('document_type', 40).notNullable()
      table.string('status', 30).notNullable()
      table.integer('input_tokens').unsigned().notNullable().defaultTo(0)
      table.integer('output_tokens').unsigned().notNullable().defaultTo(0)
      table.decimal('estimated_cost_usd', 12, 6).notNullable().defaultTo(0)
      table.integer('duration_ms').unsigned().notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
