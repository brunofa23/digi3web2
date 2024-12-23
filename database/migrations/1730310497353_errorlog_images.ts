import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'errorlog_images'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('bookrecords_id').notNullable().unsigned().references('bookrecords.id').onDelete('CASCADE')
      table.integer('typebooks_id').notNullable().unsigned().references('bookrecords.typebooks_id').onDelete('CASCADE')
      table.integer('companies_id').notNullable().unsigned().references('bookrecords.companies_id').onDelete('CASCADE')
      table.integer('seq')
      table.string('ext', 5)
      table.string('file_name', 200)
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
