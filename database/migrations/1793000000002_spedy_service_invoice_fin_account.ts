import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class SpedyServiceInvoiceFinAccount extends BaseSchema {
  protected tableName = 'spedy_service_invoices'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('fin_account_id').unsigned().nullable().references('id').inTable('fin_accounts').onUpdate('RESTRICT').onDelete('SET NULL').after('receipt_id')
      table.unique(['companies_id', 'fin_account_id'], 'uniq_spedy_nfse_company_fin_account')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['companies_id', 'fin_account_id'], 'uniq_spedy_nfse_company_fin_account')
      table.dropForeign(['fin_account_id'])
      table.dropColumn('fin_account_id')
    })
  }
}
