import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'typebooks'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('totalfiles').nullable()
      table.datetime('dateindex').nullable()

    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Reverter as alterações feitas no método "up"
      table.dropColumn('totalfiles')
      table.dropColumn('dateindex')
    })
  }



}
