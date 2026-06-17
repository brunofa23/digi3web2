import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'authorized_devices'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('device_cookie_hash', 128).nullable().index()
      table.timestamp('device_cookie_created_at').nullable()
      table.timestamp('device_cookie_last_seen_at').nullable()
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('device_cookie_hash')
      table.dropColumn('device_cookie_created_at')
      table.dropColumn('device_cookie_last_seen_at')
    })
  }
}
