import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximages'

  private async dropColumnIfExists(columnName: string) {
    const hasColumn = await this.schema.hasColumn(this.tableName, columnName)
    if (!hasColumn) return

    try {
      await this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn(columnName)
      })
    } catch (error) {
      const databaseError = error as { code?: string; errno?: number }
      const columnAlreadyRemoved =
        databaseError.code === 'ER_CANT_DROP_FIELD_OR_KEY' || databaseError.errno === 1091

      if (!columnAlreadyRemoved) throw error
    }
  }

  public async up() {
    await this.dropColumnIfExists('name')
    await this.dropColumnIfExists('cpf')
    await this.dropColumnIfExists('index_text')
  }

  public async down() {}
}
