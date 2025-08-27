import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_entities'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('excluded').defaultTo(false).after('inactive')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, table=>{
      table.dropColumn('excluded')
    })
  }
}
