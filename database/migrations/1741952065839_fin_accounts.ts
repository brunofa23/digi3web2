import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_accounts'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onDelete('CASCADE')
      table.integer('fin_emp_id').notNullable().unsigned().references('id').inTable('fin_emps').onDelete('CASCADE').onUpdate('CASCADE')
      table.integer('fin_class_id').notNullable().unsigned().references('id').inTable('fin_classes').onDelete('CASCADE').onUpdate('CASCADE')
      table.string('description',100).notNullable()
      table.decimal('amount', 10,2).notNullable()
      table.dateTime('data_billing')
      table.boolean('excluded').defaultTo('false')
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
