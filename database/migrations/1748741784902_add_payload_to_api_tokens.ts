import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'api_tokens'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
            table.json('payload').nullable()
    })
  }

  public async down () {
     this.schema.alterTable('api_tokens', (table) => {
      table.dropColumn('payload')
    })
  }
}
