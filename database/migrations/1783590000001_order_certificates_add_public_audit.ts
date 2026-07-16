import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'order_certificates'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('origin', 20).notNullable().defaultTo('internal').after('type_certificate')

      table
        .integer('public_order_certificate_link_id')
        .nullable()
        .unsigned()
        .references('id')
        .inTable('public_order_certificate_links')
        .onUpdate('RESTRICT')
        .onDelete('SET NULL')
        .after('origin')

      table.boolean('lgpd_consent_accepted').notNullable().defaultTo(false).after('public_order_certificate_link_id')
      table.timestamp('lgpd_consent_accepted_at', { useTz: true }).nullable().after('lgpd_consent_accepted')
      table.string('public_request_ip', 45).nullable().after('lgpd_consent_accepted_at')
      table.string('public_request_user_agent', 500).nullable().after('public_request_ip')

      table.index(['origin', 'created_at'], 'idx_order_cert_origin_created')
      table.index('public_order_certificate_link_id', 'idx_order_cert_public_link')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['origin', 'created_at'], 'idx_order_cert_origin_created')
      table.dropIndex(['public_order_certificate_link_id'], 'idx_order_cert_public_link')
      table.dropColumn('public_request_user_agent')
      table.dropColumn('public_request_ip')
      table.dropColumn('lgpd_consent_accepted_at')
      table.dropColumn('lgpd_consent_accepted')
      table.dropColumn('public_order_certificate_link_id')
      table.dropColumn('origin')
    })
  }
}
