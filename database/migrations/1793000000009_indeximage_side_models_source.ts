import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximage_side_models'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('source_model_id').unsigned().nullable().after('book')
      table.index(['source_model_id'], 'idx_side_model_source')
      table.foreign('source_model_id').references('id').inTable(this.tableName).onDelete('SET NULL').onUpdate('CASCADE')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['source_model_id'])
      table.dropIndex(['source_model_id'], 'idx_side_model_source')
      table.dropColumn('source_model_id')
    })
  }
}
