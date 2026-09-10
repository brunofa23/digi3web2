import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'death_certificates'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('deceased_residence_country', 50).nullable()
      table.string('filiation1_residence_country', 50).nullable()
      table.string('filiation2_residence_country', 50).nullable()
      table.string('declarant_residence_country', 50).nullable()
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('deceased_residence_country')
      table.dropColumn('filiation1_residence_country')
      table.dropColumn('filiation2_residence_country')
      table.dropColumn('declarant_residence_country')
    })
  }
}
