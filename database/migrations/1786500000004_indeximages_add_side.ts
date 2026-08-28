import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  protected tableName = 'indeximages'

  public async up () {
    const hasSide = await this.hasColumn('side')

    if (hasSide) return

    try {
      await this.schema.alterTable(this.tableName, (table) => {
        table.string('side', 5).nullable().after('sheet')
      })
    } catch (error) {
      if (!this.isDuplicateColumnError(error)) throw error
    }
  }

  public async down () {
    const hasSide = await this.hasColumn('side')

    if (!hasSide) return

    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('side')
    })
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

  private isDuplicateColumnError(error: unknown) {
    const databaseError = error as { code?: string; errno?: number }
    return databaseError.code === 'ER_DUP_FIELDNAME' || databaseError.errno === 1060
  }
}
