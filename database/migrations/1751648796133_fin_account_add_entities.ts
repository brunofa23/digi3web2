import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_accounts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('entity_id').nullable()
        .unsigned().references('id')
        .inTable('fin_entities')
        .onUpdate('CASCADE').after('id_replication')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('entity_id')
    })
  }
}
