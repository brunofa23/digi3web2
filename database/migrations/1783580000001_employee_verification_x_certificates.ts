import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class EmployeeVerificationXCertificates extends BaseSchema {
  protected tableName = 'employee_verification_x_certificates'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('married_certificate_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('married_certificates')
        .onUpdate('RESTRICT')
        .onDelete('RESTRICT')

      table
        .integer('companies_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('companies')
        .onUpdate('RESTRICT')
        .onDelete('RESTRICT')

      table
        .integer('employee_verification_id')
        .unsigned()
        .notNullable()

      table
        .foreign('employee_verification_id', 'fk_empver_x_cert_empver_id')
        .references('id')
        .inTable('employee_verifications')
        .onUpdate('RESTRICT')
        .onDelete('RESTRICT')

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onUpdate('RESTRICT')
        .onDelete('RESTRICT')

      table.string('status', 80).notNullable()
      table.dateTime('date').notNullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(
        ['married_certificate_id', 'employee_verification_id'],
        'uniq_empver_x_cert'
      )
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
