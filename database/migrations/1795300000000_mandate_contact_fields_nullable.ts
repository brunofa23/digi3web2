import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  protected tableName = 'mandate_certificates'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('applicant_cpf', 11).nullable().alter()
      table.string('applicant_whatsapp', 20).nullable().alter()
    })
  }

  public async down() {
    await Database.rawQuery('UPDATE mandate_certificates SET applicant_cpf = \'\' WHERE applicant_cpf IS NULL')
    await Database.rawQuery('UPDATE mandate_certificates SET applicant_whatsapp = \'\' WHERE applicant_whatsapp IS NULL')
    this.schema.alterTable(this.tableName, (table) => {
      table.string('applicant_cpf', 11).notNullable().alter()
      table.string('applicant_whatsapp', 20).notNullable().alter()
    })
  }
}
