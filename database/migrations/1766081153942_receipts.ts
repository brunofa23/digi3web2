import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'receipts'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.integer('order_certificate_id').notNullable().unsigned().references('id').inTable('order_certificates').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.integer('service_id').notNullable().unsigned().references('id').inTable('services').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.integer('user_id').notNullable().unsigned().references('id').inTable('users').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.string('applicant',90).nullable()
      table.string('cpf_applicant',11).nullable()
      table.string('registered1', 90).nullable()
      table.string('cpf_registered1',11).nullable()
      table.string('registered2', 90).nullable()
      table.string('cpf_registered2',11).nullable()
      table.integer('typebook_id').nullable().unsigned().references('id').inTable('typebooks').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.integer('book').nullable()
      table.integer('sheet').nullable()
      table.string('side').nullable()
      table.date('date_prevision').nullable()
      table.date('date_stamp').nullable()
      table.datetime('date_marriage').nullable()
      table.string('security_sheet',50).nullable()
      table.string('habilitation_proccess',50).nullable()
      table.string('status',15).nullable()
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
