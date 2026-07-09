import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class EmployeeVerificationsAddLocal extends BaseSchema {
  protected tableName = 'employee_verifications'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('local', 20).notNullable().defaultTo('receipt').after('description')
      table.index(['companies_id', 'local'], 'employee_verifications_company_local_idx')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['companies_id', 'local'], 'employee_verifications_company_local_idx')
      table.dropColumn('local')
    })
  }
}
