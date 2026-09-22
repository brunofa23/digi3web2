import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up () {
    this.schema.alterTable('sales_opportunities', (table) => {
      table.string('name', 255).notNullable().alter()
    })
  }

  public async down () {
    this.schema.alterTable('sales_opportunities', (table) => {
      table.string('name', 120).notNullable().alter()
    })
  }
}
