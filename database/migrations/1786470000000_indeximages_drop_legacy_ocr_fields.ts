import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximages'

  private async dropColumnIfExists(columnName: string) {
    const hasColumn = await this.schema.hasColumn(this.tableName, columnName)
    if (!hasColumn) return

    await this.schema.raw(`
      ALTER TABLE \`${this.tableName}\`
      DROP COLUMN \`${columnName}\`,
      ALGORITHM=INSTANT,
      LOCK=NONE
    `)
  }

  public async up() {
    await this.dropColumnIfExists('name')
    await this.dropColumnIfExists('cpf')
    await this.dropColumnIfExists('index_text')
  }

  public async down() {}
}
