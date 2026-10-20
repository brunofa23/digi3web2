import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'emoluments'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('price_released').notNullable().defaultTo(false).after('transfer_of_found')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('price_released')
    })
  }
}
