import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'order_certificate_averbations'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('label_text').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('label_text')
    })
  }
}
