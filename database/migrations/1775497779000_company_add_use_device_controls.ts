// database/migrations/xxxx_add_device_control_to_companies.ts
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'companies'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('use_device_control').defaultTo(false)
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('use_device_control')
    })
  }
}
