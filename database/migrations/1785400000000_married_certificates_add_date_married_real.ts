import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'married_certificates'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dateTime('date_married_real').nullable().after('dthr_schedule')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('date_married_real')
    })
  }
}
