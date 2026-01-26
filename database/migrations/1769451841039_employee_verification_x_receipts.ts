import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class EmployeeVerificationXReceipts extends BaseSchema {
  protected tableName = 'employee_verification_x_receipts'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('receipt_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('receipts')
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
        .foreign('employee_verification_id', 'fk_empver_x_rec_empver_id')
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

      table.dateTime('date').notNullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // 👇 agora com nome curto
      table.unique(
        ['receipt_id', 'employee_verification_id'],
        'uniq_empver_x_rec'
      )
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
