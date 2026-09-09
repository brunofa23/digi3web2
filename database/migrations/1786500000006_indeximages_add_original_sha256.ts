import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  protected tableName = 'indeximages'
  protected indexName = 'indeximages_original_sha256_unique'

  public async up () {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'original_sha256')

    if (!hasColumn) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.string('original_sha256', 64).nullable().after('drive_md5_checksum')
      })
    }

    const hasIndex = await this.hasIndex(this.indexName)

    if (!hasIndex) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.unique(
          ['companies_id', 'typebooks_id', 'bookrecords_id', 'drive_folder_id', 'original_sha256'],
          this.indexName
        )
      })
    }
  }

  public async down () {
    if (await this.hasIndex(this.indexName)) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.dropUnique(
          ['companies_id', 'typebooks_id', 'bookrecords_id', 'drive_folder_id', 'original_sha256'],
          this.indexName
        )
      })
    }

    if (await this.schema.hasColumn(this.tableName, 'original_sha256')) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('original_sha256')
      })
    }
  }

  private async hasIndex(indexName: string) {
    const result = await Database.rawQuery(
      `
        SELECT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
      `,
      [this.tableName, indexName]
    )

    const rows = Array.isArray(result?.[0]) ? result[0] : result
    return Array.isArray(rows) && rows.length > 0
  }
}
