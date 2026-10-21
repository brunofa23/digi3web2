import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'birth_mobile_capture_sessions'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('capture_type', 16).notNullable().defaultTo('birth').after('token_hash')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => table.dropColumn('capture_type'))
  }
}
