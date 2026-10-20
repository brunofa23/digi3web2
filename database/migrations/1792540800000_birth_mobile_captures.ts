import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected sessionsTable = 'birth_mobile_capture_sessions'
  protected filesTable = 'birth_mobile_capture_files'

  public async up() {
    this.schema.createTable(this.sessionsTable, (table) => {
      table.uuid('id').primary()
      table.integer('companies_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE')
      table.integer('created_by').unsigned().notNullable()
      table.string('token_hash', 64).notNullable().unique()
      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('created_at', { useTz: true })
      table.index(['companies_id', 'expires_at'], 'idx_birth_mobile_session_company_expiry')
    })

    this.schema.createTable(this.filesTable, (table) => {
      table.increments('id')
      table.uuid('session_id').notNullable().references('id').inTable(this.sessionsTable).onDelete('CASCADE')
      table.string('field_key', 60).notNullable()
      table.string('file_name', 80).notNullable()
      table.string('client_name', 255).notNullable()
      table.integer('size').unsigned().notNullable()
      table.timestamp('created_at', { useTz: true })
      table.unique(['session_id', 'field_key'], 'uq_birth_mobile_session_field')
    })
  }

  public async down() {
    this.schema.dropTable(this.filesTable)
    this.schema.dropTable(this.sessionsTable)
  }
}
