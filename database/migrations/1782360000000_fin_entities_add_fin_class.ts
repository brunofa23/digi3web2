import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_entities'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('fin_class_id')
        .nullable()
        .unsigned()
        .references('id')
        .inTable('fin_classes')
        .onUpdate('CASCADE')
        .onDelete('SET NULL')
        .after('companies_id')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['fin_class_id'])
      table.dropColumn('fin_class_id')
    })
  }
}
