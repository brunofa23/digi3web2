import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'webauthn_credentials'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('authorized_device_id').notNullable().index()
      table.integer('company_id').notNullable().index()
      table.integer('user_id').nullable().index()

      table.string('credential_id', 512).notNullable().unique()
      table.text('public_key').notNullable()
      table.integer('counter').notNullable().defaultTo(0)
      table.string('transports', 255).nullable()
      table.string('device_type', 50).nullable()
      table.boolean('backed_up').defaultTo(false)

      table.timestamps(true)
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
