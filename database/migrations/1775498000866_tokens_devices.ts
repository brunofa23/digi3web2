// database/migrations/xxxx_tokens_devices.ts
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'tokens_devices'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // empresa
      table.integer('company_id').notNullable().index()

      // quem gerou
      table.integer('created_by_user_id').notNullable()

      // token
      table.string('token', 128).notNullable().unique()

      // controle
      table.timestamp('expires_at').notNullable()
      table.timestamp('used_at').nullable()

      table.boolean('active').defaultTo(true)

      table.timestamps(true)
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
