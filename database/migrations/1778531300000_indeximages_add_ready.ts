import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximages'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('ready').defaultTo(false).after('register')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('ready')
    })
  }
}
