import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximages'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      //table.increments('id')
      table.integer('bookrecords_id').notNullable().unsigned().references('bookrecords.id')
      table.integer('typebooks_id').notNullable().unsigned().references('typebooks.id')
      table.integer('companies_id').notNullable().unsigned().references('companies.id')
      table.integer('seq')
      table.string('ext',5)
      table.string('file_name', 45)
      table.string('previous_file_name',45)

      table.primary(['companies_id', 'bookrecords_id','typebooks_id','seq'])
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
