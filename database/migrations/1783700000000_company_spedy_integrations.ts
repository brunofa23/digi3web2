import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CompanySpedyIntegrations extends BaseSchema {
  protected tableName = 'company_spedy_integrations'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').unsigned().notNullable().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('CASCADE')
      table.string('environment', 20).notNullable().defaultTo('sandbox')
      table.string('spedy_company_id', 80).nullable()
      table.text('spedy_api_key').nullable()
      table.boolean('is_owner').notNullable().defaultTo(false)
      table.boolean('active').notNullable().defaultTo(true)
      table.timestamp('last_sync_at', { useTz: true }).nullable()
      table.json('last_company_snapshot').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['companies_id', 'environment'])
      table.index(['spedy_company_id', 'environment'])
      table.index(['environment', 'is_owner', 'active'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
