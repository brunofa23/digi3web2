import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximages'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('name').nullable().after('previous_file_name')
      table.string('cpf').nullable().after('name')
      table.integer('book').nullable().after('cpf')
      table.integer('sheet').nullable().after('book')
      table.integer('register', 20).nullable().after('sheet')
      table.text('index_text').nullable().after('cpf')

    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('cpf')
      table.dropColumn('name')
      table.dropColumn('book')
      table.dropColumn('sheet')
      table.dropColumn('register')
      table.dropColumn('index_text')
    })
  }
}
