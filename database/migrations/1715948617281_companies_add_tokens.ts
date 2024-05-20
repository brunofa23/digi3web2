import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'companies'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('cloud').notNullable().unsigned().references('tokens.id').defaultTo(1)
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('cloud')
    })
  }
}
