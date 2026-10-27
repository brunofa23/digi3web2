import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'death_certificates'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('funeral_home_name', 150).nullable().after('burial_doctor')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('funeral_home_name')
    })
  }
}
