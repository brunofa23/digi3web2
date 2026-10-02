import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('fin_payment_methods', (table) => {
      table.boolean('receipt_immediate').notNullable().defaultTo(false)
    })
    this.schema.alterTable('receipts', (table) => {
      table.dateTime('financial_finalized_at').nullable()
    })
    this.schema.createTable('receipt_payments', (table) => {
      table.increments('id')
      table.integer('companies_id').unsigned().notNullable().references('id').inTable('companies').onDelete('RESTRICT')
      table.integer('receipt_id').unsigned().notNullable().references('id').inTable('receipts').onDelete('RESTRICT')
      table.integer('fin_paymentmethod_id').unsigned().notNullable().references('id').inTable('fin_payment_methods').onDelete('RESTRICT')
      table.integer('payment_group').unsigned().notNullable()
      table.integer('installment_number').unsigned().notNullable()
      table.integer('installment_count').unsigned().notNullable()
      table.decimal('amount', 10, 2).notNullable()
      table.date('due_date').notNullable()
      table.dateTime('received_at').nullable()
      table.integer('received_by').unsigned().nullable().references('id').inTable('users').onDelete('RESTRICT')
      table.timestamps(true, true)
      table.unique(['receipt_id', 'payment_group', 'installment_number'], 'receipt_payment_installment_unique')
      table.index(['companies_id', 'received_at', 'due_date'], 'receipt_payments_pending_idx')
    })
    this.schema.createTable('receipt_cash_entries', (table) => {
      table.increments('id')
      table.integer('companies_id').unsigned().notNullable().references('id').inTable('companies').onDelete('RESTRICT')
      table.integer('receipt_payment_id').unsigned().notNullable().unique().references('id').inTable('receipt_payments').onDelete('RESTRICT')
      table.decimal('amount', 10, 2).notNullable()
      table.dateTime('received_at').notNullable()
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.timestamps(true, true)
      table.index(['companies_id', 'received_at'], 'receipt_cash_entries_date_idx')
    })
  }

  public async down() {
    this.schema.dropTable('receipt_cash_entries')
    this.schema.dropTable('receipt_payments')
    this.schema.alterTable('receipts', (table) => table.dropColumn('financial_finalized_at'))
    this.schema.alterTable('fin_payment_methods', (table) => table.dropColumn('receipt_immediate'))
  }
}
