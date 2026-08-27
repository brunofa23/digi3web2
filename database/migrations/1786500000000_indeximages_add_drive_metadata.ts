import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  protected tableName = 'indeximages'
  protected indexName = 'indeximages_drive_duplicate_lookup_idx'

  public async up () {
    const hasDriveFileSize = await this.schema.hasColumn(this.tableName, 'drive_file_size')
    const hasDriveMd5Checksum = await this.schema.hasColumn(this.tableName, 'drive_md5_checksum')
    const hasDriveFolderId = await this.schema.hasColumn(this.tableName, 'drive_folder_id')

    if (!hasDriveFileSize || !hasDriveMd5Checksum || !hasDriveFolderId) {
      await this.schema.alterTable(this.tableName, (table) => {
        if (!hasDriveFileSize) table.bigInteger('drive_file_size').nullable().after('drive_file_id')
        if (!hasDriveMd5Checksum) table.string('drive_md5_checksum', 32).nullable().after('drive_file_size')
        if (!hasDriveFolderId) table.string('drive_folder_id', 200).nullable().after('drive_md5_checksum')
      })
    }

    const hasIndex = await this.hasDuplicateLookupIndex()

    if (!hasIndex) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.index(
          ['companies_id', 'drive_folder_id', 'drive_md5_checksum', 'drive_file_size'],
          this.indexName
        )
      })
    }
  }

  public async down () {
    const hasIndex = await this.hasDuplicateLookupIndex()

    if (hasIndex) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.dropIndex(
          ['companies_id', 'drive_folder_id', 'drive_md5_checksum', 'drive_file_size'],
          this.indexName
        )
      })
    }

    const hasDriveFolderId = await this.schema.hasColumn(this.tableName, 'drive_folder_id')
    const hasDriveMd5Checksum = await this.schema.hasColumn(this.tableName, 'drive_md5_checksum')
    const hasDriveFileSize = await this.schema.hasColumn(this.tableName, 'drive_file_size')

    if (!hasDriveFolderId && !hasDriveMd5Checksum && !hasDriveFileSize) return

    await this.schema.alterTable(this.tableName, (table) => {
      if (hasDriveFolderId) table.dropColumn('drive_folder_id')
      if (hasDriveMd5Checksum) table.dropColumn('drive_md5_checksum')
      if (hasDriveFileSize) table.dropColumn('drive_file_size')
    })
  }

  private async hasDuplicateLookupIndex() {
    const result = await Database.rawQuery(
      `
        SELECT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
      `,
      [this.tableName, this.indexName]
    )

    const rows = Array.isArray(result?.[0]) ? result[0] : result
    return Array.isArray(rows) && rows.length > 0
  }
}
