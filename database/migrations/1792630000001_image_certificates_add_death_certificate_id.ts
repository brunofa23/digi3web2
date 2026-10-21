import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'image_certificates'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('death_certificate_id').unsigned().nullable()
        .references('id').inTable('death_certificates').onDelete('RESTRICT')
        .after('born_certificate_id')
      table.index(['companies_id', 'death_certificate_id'], 'idx_imgcert_comp_death')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['companies_id', 'death_certificate_id'], 'idx_imgcert_comp_death')
      table.dropColumn('death_certificate_id')
    })
  }
}
