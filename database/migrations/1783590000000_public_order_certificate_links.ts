import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'public_order_certificate_links'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('companies_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('companies')
        .onUpdate('RESTRICT')
        .onDelete('RESTRICT')

      table.string('type', 30).notNullable()
      table.string('token', 128).notNullable().unique()
      table.boolean('active').notNullable().defaultTo(true)

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.index(['companies_id', 'type'], 'idx_pub_order_cert_company_type')
      table.index(['token', 'active'], 'idx_pub_order_cert_token_active')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
