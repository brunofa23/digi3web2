import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  protected tableName = 'companies'

  public async up () {
    await this.schema.alterTable(this.tableName, (table) => {
      table.integer('max_upload_size_mb').nullable().defaultTo(10)
    })

    await Database.from(this.tableName).update({ max_upload_size_mb: 10 })
  }

  public async down () {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('max_upload_size_mb')
    })
  }
}
