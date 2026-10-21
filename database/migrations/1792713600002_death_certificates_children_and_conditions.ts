import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'death_certificates'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('other_significant_conditions').notNullable().defaultTo(true).after('status_form')
      table.boolean('left_assets').nullable().after('other_significant_conditions')
      table.boolean('left_children').nullable().after('left_assets')
      table.boolean('left_will').nullable().after('left_children')
      table.boolean('minor_heirs').nullable().after('left_will')
      table.boolean('interdicted_heirs').nullable().after('minor_heirs')
      table.json('death_children').nullable().after('interdicted_heirs')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('other_significant_conditions')
      table.dropColumn('left_assets')
      table.dropColumn('left_children')
      table.dropColumn('left_will')
      table.dropColumn('minor_heirs')
      table.dropColumn('interdicted_heirs')
      table.dropColumn('death_children')
    })
  }
}
