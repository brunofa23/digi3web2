import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'emoluments'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('transfer_of_found').notNullable().defaultTo(false).after('inactive')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('transfer_of_found')
    })
  }
}
