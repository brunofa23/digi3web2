import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'order_certificates'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('book_id').notNullable().unsigned().references('id').inTable('books')
      .after('companies_id').onUpdate('RESTRICT').onDelete('RESTRICT')
      
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, table=>{
      table.dropColumn('book_id')
    })
  }
}
