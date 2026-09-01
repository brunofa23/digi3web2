import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'public_order_certificate_links'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('form_settings').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('form_settings')
    })
  }
}
