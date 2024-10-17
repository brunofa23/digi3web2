import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'document_configs'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('averb_anot').nullable()
    })
  }
  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Reverter as alterações feitas no método "up"
      table.dropColumn('averb_anot')
    })
  }

}
