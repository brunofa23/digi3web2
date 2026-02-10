import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'secondcopy_certificates'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('typebook_id').nullable().unsigned().references('id').inTable('typebooks').onUpdate('RESTRICT').onDelete('RESTRICT').after('registered1')
      table.string('term1').nullable().after('sheet1')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table)=>{
      table.dropColumn('typebook_id')
      table.dropColumn('term1')
    })
  }
}
