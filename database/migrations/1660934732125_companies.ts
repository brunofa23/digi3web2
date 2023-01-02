import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'companies'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name',120).notNullable()
      table.string('shortname', 45).notNullable().unique()
      table.string('address', 70)
      table.string('number')
      table.string('complement',45)
      table.string('postalcode', 8)
      table.string('district', 70)
      table.string('city', 45)
      table.string('state', 2)
      table.string('cnpj')
      table.string('responsablename')
      table.string('phoneresponsable')
      table.string('email')
      table.boolean('status')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
