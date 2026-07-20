import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'company_fiscal_integrations'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.string('provider', 20).notNullable().defaultTo('spedy')
      table.string('environment', 20).notNullable().defaultTo('sandbox')
      table.string('spedy_company_id', 60).nullable()
      table.text('spedy_api_key').nullable()
      table.string('tax_regime', 60).nullable()
      table.string('state_tax_number', 30).nullable()
      table.string('city_tax_number', 30).nullable()
      table.string('economic_activity_code', 20).nullable()
      table.string('city_ibge_code', 7).nullable()
      table.string('default_federal_service_code', 20).nullable()
      table.string('default_city_service_code', 30).nullable()
      table.string('default_nbs_code', 20).nullable()
      table.decimal('default_iss_rate', 8, 6).nullable()
      table.string('default_taxation_type', 60).nullable()
      table.boolean('enabled').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['companies_id', 'provider'])
      table.index(['companies_id', 'enabled'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
