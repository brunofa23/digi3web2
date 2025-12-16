import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'secondcopy_certificates'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('obs', 255).nullable().after('applicant')
      table.boolean('inactive').defaultTo(false).after('city2')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('obs')
      table.dropColumn('inactive')
    })
  }
}
