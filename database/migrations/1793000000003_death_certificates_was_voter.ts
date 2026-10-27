import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'death_certificates'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('was_voter').nullable().after('death_children')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('was_voter')
    })
  }
}
