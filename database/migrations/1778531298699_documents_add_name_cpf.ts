import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximages'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('book').nullable().after('previous_file_name')
      table.integer('sheet').nullable().after('book')
      table.integer('register', 20).nullable().after('sheet')

    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('book')
      table.dropColumn('sheet')
      table.dropColumn('register')
    })
  }
}
