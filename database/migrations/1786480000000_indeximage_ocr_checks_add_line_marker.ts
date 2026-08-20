import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  protected tableName = 'indeximage_ocr_checks'
  protected indexName = 'idx_img_ocr_check_marker'

  public async up() {
    const hasColumn = await this.hasColumn('line_marker')

    if (!hasColumn) {
      try {
        await this.schema.alterTable(this.tableName, (table) => {
          table.boolean('line_marker').notNullable().defaultTo(false).after('review_status')
        })
      } catch (error) {
        if (!this.isDuplicateColumnError(error)) throw error
      }
    }

    const hasIndex = await this.hasIndex()

    if (!hasIndex) {
      try {
        await this.schema.alterTable(this.tableName, (table) => {
          table.index(['companies_id', 'typebooks_id', 'line_marker'], this.indexName)
        })
      } catch (error) {
        if (!this.isDuplicateIndexError(error)) throw error
      }
    }
  }

  public async down() {
    const hasColumn = await this.hasColumn('line_marker')
    if (!hasColumn) return

    const hasIndex = await this.hasIndex()

    if (hasIndex) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.dropIndex(['companies_id', 'typebooks_id', 'line_marker'], this.indexName)
      })
    }

    try {
      await this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('line_marker')
      })
    } catch (error) {
      if (!this.isMissingColumnError(error)) throw error
    }
  }

  private async hasColumn(columnName: string) {
    const result = await Database.rawQuery(
      `
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
      `,
      [this.tableName, columnName]
    )

    const rows = Array.isArray(result?.[0]) ? result[0] : result
    return Array.isArray(rows) && rows.length > 0
  }

  private async hasIndex() {
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

  private isDuplicateColumnError(error: unknown) {
    const databaseError = error as { code?: string; errno?: number }
    return databaseError.code === 'ER_DUP_FIELDNAME' || databaseError.errno === 1060
  }

  private isDuplicateIndexError(error: unknown) {
    const databaseError = error as { code?: string; errno?: number }
    return databaseError.code === 'ER_DUP_KEYNAME' || databaseError.errno === 1061
  }

  private isMissingColumnError(error: unknown) {
    const databaseError = error as { code?: string; errno?: number }
    return databaseError.code === 'ER_CANT_DROP_FIELD_OR_KEY' || databaseError.errno === 1091
  }
}
