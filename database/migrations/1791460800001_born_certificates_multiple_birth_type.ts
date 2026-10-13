import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'born_certificates'

  public async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.string('multiple_birth_type', 20).nullable().after('twins')
    })
  }

  public async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('multiple_birth_type')
    })
  }
}
