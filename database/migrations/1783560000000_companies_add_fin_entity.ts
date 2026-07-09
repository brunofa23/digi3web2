import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'companies'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('fin_entity_id').nullable().unsigned().references('id').inTable('fin_entities').onUpdate('CASCADE')
      table.unique(['fin_entity_id'], 'companies_fin_entity_id_unique')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['fin_entity_id'], 'companies_fin_entity_id_unique')
      table.dropColumn('fin_entity_id')
    })
  }
}
