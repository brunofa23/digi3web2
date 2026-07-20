import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'service_fiscal_configs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.integer('service_id').notNullable().unsigned().references('id').inTable('services').onUpdate('RESTRICT').onDelete('RESTRICT')
      table.string('federal_service_code', 20).nullable()
      table.string('city_service_code', 30).nullable()
      table.string('nbs_code', 20).nullable()
      table.string('taxation_type', 60).nullable()
      table.decimal('iss_rate', 8, 6).nullable()
      table.boolean('iss_withheld').notNullable().defaultTo(false)
      table.text('description_template').nullable()
      table.boolean('enabled').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['companies_id', 'service_id'])
      table.index(['companies_id', 'enabled'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
