import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_classes'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('fin_emp_id').nullable().unsigned()
        .after('companies_id').references('id').inTable('fin_emps')

    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('fin_emp_id')
    })
  }
}
