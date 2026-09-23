import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('cargo', 50).nullable().after('status')
      table.string('obs', 100).nullable().after('cargo')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('obs')
      table.dropColumn('cargo')
    })
  }
}
