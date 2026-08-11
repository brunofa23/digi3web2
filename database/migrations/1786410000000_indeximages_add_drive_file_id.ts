import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximages'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('drive_file_id', 200).nullable().after('file_name').index()
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('drive_file_id')
    })
  }
}
