import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'usergroups'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('available_for_user_creation').notNullable().defaultTo(false)
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('available_for_user_creation')
    })
  }
}
