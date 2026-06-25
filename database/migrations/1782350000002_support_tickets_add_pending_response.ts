import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'support_tickets'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('pending_response_from', 30).nullable().after('status')
      table.string('last_interaction_by', 30).nullable().after('pending_response_from')
      table.timestamp('last_interaction_at', { useTz: true }).nullable().after('last_interaction_by')

      table.index(['companies_id', 'pending_response_from'], 'support_tickets_company_pending_idx')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['companies_id', 'pending_response_from'], 'support_tickets_company_pending_idx')
      table.dropColumn('pending_response_from')
      table.dropColumn('last_interaction_by')
      table.dropColumn('last_interaction_at')
    })
  }
}
