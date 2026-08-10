import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'people'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.date('date_death').nullable().after('date_birth')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('date_death')
    })
  }
}
