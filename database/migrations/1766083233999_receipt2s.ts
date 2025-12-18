import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'receipt_items'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.integer('receipt_id').notNullable().unsigned().references('id').inTable('receipts').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.integer('service_id').notNullable().unsigned().references('id').inTable('services').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.integer('emolument_id').notNullable().unsigned().references('id').inTable('emoluments').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.integer('qtde').notNullable().defaultTo(0)
      table.decimal('amount',10,2).notNullable().defaultTo(0)
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
