import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'people'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('mother', 100).notNullable().after('nationality')
      table.string('father', 100).notNullable().after('nationality')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('mother')
      table.dropColumn('father')
    })
  }
}
