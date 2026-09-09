import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  protected tableName = 'companies'

  public async up () {
    const hasUploadLimitColumn = await this.schema.hasColumn(this.tableName, 'max_upload_size_mb')

    if (!hasUploadLimitColumn) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.integer('max_upload_size_mb').nullable().defaultTo(10)
      })
    }

    await Database.from(this.tableName)
      .whereNull('max_upload_size_mb')
      .orWhere('max_upload_size_mb', 0)
      .update({ max_upload_size_mb: 10 })
  }

  public async down () {
    const hasUploadLimitColumn = await this.schema.hasColumn(this.tableName, 'max_upload_size_mb')

    if (hasUploadLimitColumn) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('max_upload_size_mb')
      })
    }
  }
}
