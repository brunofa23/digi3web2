import BaseSchema from '@ioc:Adonis/Lucid/Schema'

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
    return this.schema.hasColumn(this.tableName, columnName)
  }

  private isDuplicateColumnError(error: unknown) {
    const databaseError = error as { code?: string; errno?: number; message?: string; sqlMessage?: string }
    const message = databaseError.sqlMessage || databaseError.message || ''
    return databaseError.code === 'ER_DUP_FIELDNAME'
      || databaseError.errno === 1060
      || message.includes('Duplicate column name')
  }
}
