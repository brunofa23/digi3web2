import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
       table.index('prot')
       table.index('obs')
      //table.index(['prot','obs'])
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex('prot')
      table.dropIndex('obs')
      //table.dropIndex(['prot','obs'])
    })
  }
}
