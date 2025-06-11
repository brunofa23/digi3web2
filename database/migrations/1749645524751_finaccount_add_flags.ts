import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_accounts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('analyze').defaultTo(false).after('replicate')
      table.boolean('future').defaultTo(false).after('analyze')
      table.boolean('reserve').defaultTo(false).after('future')
      table.boolean('overplus').defaultTo(false).after('reserve') //sobra
      table.decimal('limit_amount', 10, 2).nullable().after('overplus')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Reverter as alterações feitas no método "up"
      table.dropColumn('analyze')
      table.dropColumn('future')
      table.dropColumn('reserve')
      table.dropColumn('overplus')
      table.dropColumn('limit_amount')
    })
  }
}
