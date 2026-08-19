import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximages'

  public async up() {
    const hasName = await this.schema.hasColumn(this.tableName, 'name')
    const hasCpf = await this.schema.hasColumn(this.tableName, 'cpf')
    const hasIndexText = await this.schema.hasColumn(this.tableName, 'index_text')

    if (!hasName && !hasCpf && !hasIndexText) return

    await this.schema.alterTable(this.tableName, (table) => {
      if (hasName) table.dropColumn('name')
      if (hasCpf) table.dropColumn('cpf')
      if (hasIndexText) table.dropColumn('index_text')
    })
  }

  public async down() {}
}
