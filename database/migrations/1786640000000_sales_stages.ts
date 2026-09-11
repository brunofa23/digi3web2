import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'sales_stages'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 80).notNullable()
      table.integer('position').unsigned().notNullable()
      table.string('color', 20).notNullable()
      table.boolean('is_final').notNullable().defaultTo(false)
      table.enum('final_result', ['won', 'lost']).nullable()
      table.boolean('active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.unique(['name'])
      table.index(['active', 'position'])
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
