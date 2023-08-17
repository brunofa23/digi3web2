import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('work_schedule', 50).nullable()
      table.datetime('access_image').nullable()

    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Reverter as alterações feitas no método "up"
      table.dropColumn('work_schedule')
      table.dropColumn('access_image')
    })
  }
}
