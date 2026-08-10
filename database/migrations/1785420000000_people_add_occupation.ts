import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'people'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('occupation', 100).nullable().after('occupation_id')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('occupation')
    })
  }
}
