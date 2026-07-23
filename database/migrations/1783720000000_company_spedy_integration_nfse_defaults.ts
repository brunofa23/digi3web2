import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CompanySpedyIntegrationNfseDefaults extends BaseSchema {
  protected tableName = 'company_spedy_integrations'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('service_invoice_defaults').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('service_invoice_defaults')
    })
  }
}
