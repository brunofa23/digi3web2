import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'groupxpermissions'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('companies_id').unsigned().nullable()
        .references('id').inTable('companies').onUpdate('CASCADE').onDelete('CASCADE')
      table.index(['companies_id', 'usergroup_id', 'permissiongroup_id'], 'groupxpermissions_company_scope_idx')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['companies_id', 'usergroup_id', 'permissiongroup_id'], 'groupxpermissions_company_scope_idx')
      table.dropColumn('companies_id')
    })
  }
}
