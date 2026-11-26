import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'emoluments'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('arquivamento').notNullable().defaultTo(false).after('price_released')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('arquivamento')
    })
  }
}
