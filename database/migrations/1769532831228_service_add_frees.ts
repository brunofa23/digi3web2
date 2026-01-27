import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'services'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('free').defaultTo(false).after('description')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table)=>{
      table.dropColumn('free')
    })
  }
}
