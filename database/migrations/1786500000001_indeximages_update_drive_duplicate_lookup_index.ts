import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  protected tableName = 'indeximages'
  protected indexName = 'indeximages_drive_duplicate_lookup_idx'
  protected oldColumns = ['companies_id', 'drive_folder_id', 'drive_md5_checksum', 'drive_file_size']
  protected newColumns = ['companies_id', 'typebooks_id', 'bookrecords_id', 'drive_folder_id', 'drive_md5_checksum', 'drive_file_size']

  public async up () {
    if (await this.hasIndexColumns(this.newColumns)) return

    await this.dropIndexIfExists()

    await this.schema.alterTable(this.tableName, (table) => {
      table.index(this.newColumns, this.indexName)
    })
  }

  public async down () {
    if (await this.hasIndexColumns(this.oldColumns)) return

    await this.dropIndexIfExists()

    await this.schema.alterTable(this.tableName, (table) => {
      table.index(this.oldColumns, this.indexName)
    })
  }

  private async dropIndexIfExists() {
    try {
      await Database.rawQuery(`ALTER TABLE ${this.tableName} DROP INDEX ${this.indexName}`)
    } catch (error) {
      const databaseError = error as { code?: string; errno?: number }
      const indexNotFound =
        databaseError.code === 'ER_CANT_DROP_FIELD_OR_KEY' || databaseError.errno === 1091

      if (!indexNotFound) throw error
    }
  }

  private async hasIndexColumns(columns: string[]) {
    const result = await Database.rawQuery(
      `
        SELECT COLUMN_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
        ORDER BY SEQ_IN_INDEX
      `,
      [this.tableName, this.indexName]
    )

    const rows = Array.isArray(result?.[0]) ? result[0] : result
    if (!Array.isArray(rows)) return false

    const indexColumns = rows.map((row) => row.COLUMN_NAME || row.column_name)
    return indexColumns.length === columns.length && indexColumns.every((column, index) => column === columns[index])
  }
}
