import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'receipts'

  public async up() {
    if (await this.schema.hasColumn(this.tableName, 'delivery_user_id')) return

    this.schema.alterTable(this.tableName, (table) => {
      table.integer('delivery_user_id').unsigned().nullable()
    })
  }

  public async down() {
    if (!(await this.schema.hasColumn(this.tableName, 'delivery_user_id'))) return

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('delivery_user_id')
    })
  }
}
