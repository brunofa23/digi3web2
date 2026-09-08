import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'image_certificates'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('born_certificate_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('born_certificates')
        .onUpdate('RESTRICT')
        .onDelete('RESTRICT')
        .after('married_certificate_id')

      table.index(['companies_id', 'born_certificate_id'], 'idx_imgcert_comp_born')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['companies_id', 'born_certificate_id'], 'idx_imgcert_comp_born')
      table.dropColumn('born_certificate_id')
    })
  }
}
