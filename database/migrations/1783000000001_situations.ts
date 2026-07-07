import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'situation'
  protected pivotTableName = 'company_situation'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('id').unsigned().primary()
      table.string('description', 120).notNullable()
      table.boolean('inactive').notNullable().defaultTo(false)
    })

    this.schema.createTable(this.pivotTableName, (table) => {
      table.integer('companies_id').unsigned().notNullable()
        .references('id').inTable('companies')
        .onUpdate('RESTRICT')
        .onDelete('CASCADE')
      table.integer('situation_id').unsigned().notNullable()
        .references('id').inTable('situation')
        .onUpdate('RESTRICT')
        .onDelete('RESTRICT')

      table.primary(['companies_id', 'situation_id'])
      table.index(['situation_id'], 'company_situation_situation_id_idx')
    })
  }

  public async down() {
    this.schema.dropTable(this.pivotTableName)
    this.schema.dropTable(this.tableName)
  }
}
