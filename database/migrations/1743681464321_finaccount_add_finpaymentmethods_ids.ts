import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_accounts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('fin_paymentmethod_id').notNullable().unsigned().references('id').inTable('fin_payment_methods').after('fin_class_id')
      table.dropColumn('payment_method')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('fin_paymentmethod_id')
    })
  }
}
