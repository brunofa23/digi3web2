import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'permissiongroups'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('id').primary().unsigned().notNullable()
      table.string('name', 100).notNullable()
      table.string('desc',200).nullable()
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
