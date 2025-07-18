import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_entities'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onUpdate('CASCADE')
      table.string('description', 100).notNullable()
      table.string('responsible', 50)
      table.string('phone', 20)
      table.string('obs')
      table.boolean('inactive').defaultTo(false)
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
