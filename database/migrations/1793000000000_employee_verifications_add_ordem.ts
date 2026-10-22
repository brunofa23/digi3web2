import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class EmployeeVerificationsAddOrdem extends BaseSchema {
  protected tableName = 'employee_verifications'

  public async up () {
    if (!(await this.schema.hasColumn(this.tableName, 'ordem'))) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.integer('ordem').unsigned().nullable().after('inactive')
      })
    }

    await this.schema.raw("UPDATE employee_verifications SET ordem = CAST(SUBSTRING_INDEX(description, '-', 1) AS UNSIGNED) WHERE ordem IS NULL AND description REGEXP '^[0-9]+-'")
  }

  public async down () {
    // A coluna pode existir antes desta migration; preservá-la evita perda de dados no rollback.
  }
}
