import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'bookrecords'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('userid').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Reverter as alterações feitas no método "up"
      table.dropColumn('userid')
    })
  }



}
