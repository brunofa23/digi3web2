import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'documenttypes'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('local',15).nullable().after('description')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, table=>{
      table.dropColumn('local')
    })
  }
}
