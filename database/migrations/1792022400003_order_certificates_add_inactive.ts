import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'order_certificates'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('inactive').notNullable().defaultTo(false).after('certificate_id')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('inactive')
    })
  }
}
