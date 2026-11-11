import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximage_side_models'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.tinyint('validation_accuracy_threshold').unsigned().nullable().after('source_books')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('validation_accuracy_threshold')
    })
  }
}
