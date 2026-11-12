import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximage_side_models'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dateTime('archived_at').nullable().after('finished_at')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('archived_at')
    })
  }
}
