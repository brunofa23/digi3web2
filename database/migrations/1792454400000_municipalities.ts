import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'municipalities'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('ibge_code').unsigned().primary()
      table.string('name', 120).notNullable()
      table.string('uf', 2).notNullable()
      table.integer('uf_ibge_code').unsigned().notNullable()

      table.index(['uf', 'name'], 'municipalities_uf_name_index')
      table.unique(['uf', 'name'], 'municipalities_uf_name_unique')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
