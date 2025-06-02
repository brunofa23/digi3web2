import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'usergroups'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      //table.integer('companies_id').nullable().unsigned().references('companies.id').onDelete('CASCADE').onUpdate('CASCADE')
      table.string('name',60).notNullable()
      table.boolean('inactive').defaultTo(false)
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
