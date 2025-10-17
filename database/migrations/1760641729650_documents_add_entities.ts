import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('fin_entities_id').nullable().unsigned()
      .after('companies_id').references('fin_entities.id')
      .onDelete('CASCADE').onUpdate('CASCADE')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('fin_entities_id')
    })
  }
}
