import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('support_tickets', (table) => {
      table.string('client_email', 255).nullable().after('contact')
    })

    this.schema.createTable('support_ticket_settings', (table) => {
      table.increments('id').primary()
      table.text('support_emails').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable('support_ticket_settings')
    this.schema.alterTable('support_tickets', (table) => {
      table.dropColumn('client_email')
    })
  }
}
