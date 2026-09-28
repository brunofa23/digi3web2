import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class SpedyServiceInvoiceHistory extends BaseSchema {
  protected tableName = 'spedy_service_invoices'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('processing_history').nullable().after('processing_detail')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('processing_history')
    })
  }
}
