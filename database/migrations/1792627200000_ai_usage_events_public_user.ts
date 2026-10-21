import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'ai_usage_events'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('user_id').unsigned().nullable().alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('user_id').unsigned().notNullable().alter()
    })
  }
}
