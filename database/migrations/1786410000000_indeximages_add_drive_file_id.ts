import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  protected tableName = 'indeximages'
  protected indexName = 'indeximages_drive_file_id_idx'

  public async up () {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'drive_file_id')

    if (!hasColumn) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.string('drive_file_id', 200).nullable().after('file_name')
      })
    }

    const hasIndex = await this.hasDriveFileIdIndex()

    if (!hasIndex) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.index(['drive_file_id'], this.indexName)
      })
    }
  }

  public async down () {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'drive_file_id')
    if (!hasColumn) return

    const hasIndex = await this.hasDriveFileIdIndex()

    if (hasIndex) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.dropIndex(['drive_file_id'], this.indexName)
      })
    }

    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('drive_file_id')
    })
  }

  private async hasDriveFileIdIndex() {
    const result = await Database.rawQuery(
      `
        SELECT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND (INDEX_NAME = ? OR COLUMN_NAME = ?)
      `,
      [this.tableName, this.indexName, 'drive_file_id']
    )

    const rows = Array.isArray(result?.[0]) ? result[0] : result
    return Array.isArray(rows) && rows.length > 0
  }
}
