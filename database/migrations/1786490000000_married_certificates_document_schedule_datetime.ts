import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class MarriedCertificatesDocumentScheduleDatetime extends BaseSchema {
  protected tableName = 'married_certificates'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dateTime('document_schedule_date').nullable().alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.date('document_schedule_date').nullable().alter()
    })
  }
}
