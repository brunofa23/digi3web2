import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_classes'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('cost',5).after('debit_credit')
      table.string('allocation',5).after('cost')
      table.decimal('limit_amount',10,2).after('allocation')

    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('cost')
      table.dropColumn('allocation')
      table.dropColumn('limit_amount')
    })
  }
}

