import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximages'

  public async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.integer('book').nullable().after('previous_file_name')
      table.integer('sheet').nullable().after('book')
      table.integer('register', 20).nullable().after('sheet')

    })
  }

  public async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('book')
      table.dropColumn('sheet')
      table.dropColumn('register')
    })
  }
}
