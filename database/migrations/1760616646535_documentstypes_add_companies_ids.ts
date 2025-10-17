import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'documenttypes'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('companies_id').after('id').notNullable().unsigned().references('id').inTable('companies').onUpdate('CASCADE').defaultTo(1)

    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('companies_id')
    })
  }
}
