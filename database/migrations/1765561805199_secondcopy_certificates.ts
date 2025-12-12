import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'secondcopy_certificates'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.integer('documenttype_id').nullable().unsigned().references('documenttypes.id').onDelete('CASCADE').onUpdate('CASCADE')
      table.string('payment_method', 10).nullable
      table.integer('applicant').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT')
      table.integer('registered1').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT')
      table.integer('book1').nullable()
      table.integer('sheet1').nullable()
      table.string('city1').nullable
      table.integer('registered2').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT')
      table.integer('book2').nullable()
      table.integer('sheet2').nullable()
      table.string('city2').nullable
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
