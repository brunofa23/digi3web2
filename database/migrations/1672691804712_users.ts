import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {

      table.primary(['id','companies_id'])
      table.unique(['companies_id', 'username'])

      table.increments('id').primary()
      table.integer('companies_id').notNullable().unsigned().references('companies.id')
      table.string('name' , 45)
      table.string('username' , 45).notNullable()
      table.string('email', 255).notNullable()
      table.string('password', 180).notNullable()
      table.string('remember_me_token').nullable()
      table.integer('permission_level').unsigned().notNullable().defaultTo(5)
      table.boolean('superuser')
      table.boolean('status')
      /**
       * Uses timestampz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
