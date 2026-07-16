import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'image_certificates'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('index_text').nullable()
      table.json('extracted_data').nullable()
      table.boolean('ready').nullable().defaultTo(false)
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('index_text')
      table.dropColumn('extracted_data')
      table.dropColumn('ready')
    })
  }
}
