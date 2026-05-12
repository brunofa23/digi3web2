import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('name', 500).nullable().after('yeardoc')
      table.string('cpf', 300).nullable().after('name')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('cpf')
      table.dropColumn('name')
    })
  }
}
