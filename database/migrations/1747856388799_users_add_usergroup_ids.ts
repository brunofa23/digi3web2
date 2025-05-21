import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('usergroup_id').notNullable().unsigned().references('usergroups.id').onDelete('CASCADE').onUpdate('CASCADE').defaultTo(1).after('companies_id')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('usergroup_id')
    })
  }
}
