import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'death_certificates'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('burial_witnesses_enabled').notNullable().defaultTo(false).after('burial_witnesses')
      table.string('burial_witness1_name', 90).nullable().after('burial_witnesses_enabled')
      table.string('burial_witness1_document_type', 50).nullable().after('burial_witness1_name')
      table.string('burial_witness1_document_number', 30).nullable().after('burial_witness1_document_type')
      table.string('burial_witness2_name', 90).nullable().after('burial_witness1_document_number')
      table.string('burial_witness2_document_type', 50).nullable().after('burial_witness2_name')
      table.string('burial_witness2_document_number', 30).nullable().after('burial_witness2_document_type')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('burial_witnesses_enabled')
      table.dropColumn('burial_witness1_name')
      table.dropColumn('burial_witness1_document_type')
      table.dropColumn('burial_witness1_document_number')
      table.dropColumn('burial_witness2_name')
      table.dropColumn('burial_witness2_document_type')
      table.dropColumn('burial_witness2_document_number')
    })
  }
}
