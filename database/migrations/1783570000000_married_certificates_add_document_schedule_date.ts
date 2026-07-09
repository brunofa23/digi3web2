import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'married_certificates'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.date('document_schedule_date').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('document_schedule_date')
    })
  }
}
