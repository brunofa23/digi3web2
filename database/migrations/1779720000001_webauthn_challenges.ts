import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'webauthn_challenges'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('company_id').notNullable().index()
      table.integer('user_id').nullable().index()
      table.integer('token_device_id').nullable().index()

      table.string('type', 30).notNullable().index()
      table.string('challenge', 512).notNullable()
      table.string('device_name', 150).nullable()
      table.timestamp('expires_at').notNullable()
      table.timestamp('used_at').nullable()

      table.timestamps(true)
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
