import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_images'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('path').after('file_name').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('path')
    })
  }
}
