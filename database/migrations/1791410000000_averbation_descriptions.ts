import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'averbation_descriptions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').unsigned().notNullable().references('id').inTable('companies').onDelete('RESTRICT')
      table.string('name', 255).notNullable()
      table.text('description').nullable()
      table.boolean('inactive').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.index(['companies_id', 'id'], 'averbation_descriptions_company_id_idx')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
