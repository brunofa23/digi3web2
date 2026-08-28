import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  protected tableName = 'indeximages'

  public async up () {
    const hasImageOrigin = await this.hasColumn('image_origin')
    const hasImageWidth = await this.hasColumn('image_width')
    const hasImageHeight = await this.hasColumn('image_height')

    if (hasImageOrigin && hasImageWidth && hasImageHeight) return

    await this.schema.alterTable(this.tableName, (table) => {
      if (!hasImageOrigin) table.string('image_origin', 50).nullable().after('drive_folder_id')
      if (!hasImageWidth) table.integer('image_width').unsigned().nullable().after('image_origin')
      if (!hasImageHeight) table.integer('image_height').unsigned().nullable().after('image_width')
    })
  }

  public async down () {
    const hasImageHeight = await this.hasColumn('image_height')
    const hasImageWidth = await this.hasColumn('image_width')
    const hasImageOrigin = await this.hasColumn('image_origin')

    if (!hasImageHeight && !hasImageWidth && !hasImageOrigin) return

    await this.schema.alterTable(this.tableName, (table) => {
      if (hasImageHeight) table.dropColumn('image_height')
      if (hasImageWidth) table.dropColumn('image_width')
      if (hasImageOrigin) table.dropColumn('image_origin')
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
}
