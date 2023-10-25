import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'bookrecords'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {

      table.primary(['id', 'typebooks_id', 'books_id', 'companies_id'])
      table.increments('id')

      table.integer('typebooks_id').notNullable().unsigned().references('typebooks.id').onDelete('CASCADE')
      table.integer('books_id').notNullable().unsigned().references('typebooks.books_id').onDelete('CASCADE')
      table.integer('companies_id').notNullable().unsigned().references('companies.id').onDelete('CASCADE')

      table.integer('cod')
      table.integer('book')
      table.integer('sheet')
      table.string('side')
      table.string('approximate_term')
      table.integer('indexbook')
      table.string('obs')
      table.string('letter')
      table.string('year')
      table.string('model')

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
