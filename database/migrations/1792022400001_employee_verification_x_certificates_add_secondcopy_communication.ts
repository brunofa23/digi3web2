import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'employee_verification_x_certificates'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('secondcopy_certificate_id').unsigned().nullable().after('mandate_certificate_id')
      table.integer('communication_certificate_id').unsigned().nullable().after('secondcopy_certificate_id')
      table.foreign('secondcopy_certificate_id', 'fk_empver_x_cert_secondcopy')
        .references('id').inTable('secondcopy_certificates').onDelete('RESTRICT')
      table.foreign('communication_certificate_id', 'fk_empver_x_cert_communication')
        .references('id').inTable('communication_certificates').onDelete('RESTRICT')
      table.unique(['secondcopy_certificate_id', 'employee_verification_id'], 'uniq_empver_x_secondcopy')
      table.unique(['communication_certificate_id', 'employee_verification_id'], 'uniq_empver_x_communication')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign('secondcopy_certificate_id', 'fk_empver_x_cert_secondcopy')
      table.dropForeign('communication_certificate_id', 'fk_empver_x_cert_communication')
      table.dropUnique(['secondcopy_certificate_id', 'employee_verification_id'], 'uniq_empver_x_secondcopy')
      table.dropUnique(['communication_certificate_id', 'employee_verification_id'], 'uniq_empver_x_communication')
      table.dropColumn('secondcopy_certificate_id')
      table.dropColumn('communication_certificate_id')
    })
  }
}
