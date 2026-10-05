import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.raw('ALTER TABLE receipt_payments ADD COLUMN canceled_at DATETIME NULL AFTER received_by')
  }

  public async down() {
    this.schema.alterTable('receipt_payments', (table) => table.dropColumn('canceled_at'))
  }
}
