// database/migrations/xxxx_authorized_devices.ts
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'authorized_devices'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('company_id').notNullable().index()
      table.integer('user_id').nullable().index()

      table.string('device_name', 150).notNullable()
      table.string('device_identifier', 255).notNullable().index()

      table.boolean('active').defaultTo(true)
      table.timestamp('last_used_at').nullable()
      table.timestamp('revoked_at').nullable()

      table.timestamps(true)
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
