import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_accounts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.datetime('date_conciliation').after('data_billing')
      table.integer('id_replication').after('fin_paymentmethod_id').nullable().unsigned().references('id').inTable('fin_accounts')
      table.decimal('amount_paid', 10,2).nullable().after('amount')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('date_conciliation')
      table.dropColumn('id_replication')
      table.dropColumn('amount_paid')
    })
  }
}
