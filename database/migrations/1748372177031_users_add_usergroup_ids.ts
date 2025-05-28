import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('usergroup_id').after('companies_id')
      .defaultTo(1).notNullable().unsigned().references('id').inTable('usergroups').onDelete('CASCADE')
    })
  }

  public async down () {
     this.schema.alterTable(this.tableName, table => {
      table.dropColumn('usergroup_id')
    })
  }
}
