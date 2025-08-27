import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_classes'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('inactive').defaultTo(false).after('excluded')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, table=>{
      table.dropColumn('inactive')
    })
  }
}
