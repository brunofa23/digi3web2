import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'receipts'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('stamps',255).after('date_stamp').nullable
      table.integer('tributation_id').nullable().unsigned().references('id').inTable('tributations')
      .onUpdate('RESTRICT').onDelete('RESTRICT').after('user_id')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table)=>{
      table.dropColumn('stamps')
      table.dropColumn('tributation_id')

    })
  }
}
