import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'typebooks'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').notNullable().unsigned().references('companies.id').onDelete('CASCADE')
      table.string('name')
      table.boolean('status')
      table.string('path',120)
      table.integer('books_id').notNullable().unsigned().references('books.id').onDelete('CASCADE')

      table.primary(['id', 'companies_id'])
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
