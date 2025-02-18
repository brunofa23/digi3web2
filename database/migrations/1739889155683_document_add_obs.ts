import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('obs',350).nullable()
    })
  }
  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Reverter as alterações feitas no método "up"
      table.dropColumn('obs')
    })
  }

}
