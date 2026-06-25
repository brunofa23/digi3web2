import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'support_tickets'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('contact', 120).nullable().after('request_type')
      table.text('history').nullable().after('description')
      table.text('private_notes').nullable().after('history')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('contact')
      table.dropColumn('history')
      table.dropColumn('private_notes')
    })
  }
}
