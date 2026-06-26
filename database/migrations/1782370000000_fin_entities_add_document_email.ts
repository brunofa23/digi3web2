import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_entities'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('cpf_cnpj', 18).nullable().after('description')
      table.string('email', 90).nullable().after('cpf_cnpj')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('email')
      table.dropColumn('cpf_cnpj')
    })
  }
}
