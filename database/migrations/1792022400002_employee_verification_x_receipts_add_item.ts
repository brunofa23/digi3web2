import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class EmployeeVerificationXReceiptsAddItem extends BaseSchema {
  protected tableName = 'employee_verification_x_receipts'
  private readonly indexName = 'uniq_empver_x_rec_item_sequence'
  private readonly columnMarker = 'digi3_order_sequence_migration_1792022400002'

  public async up () {
    if (!(await this.schema.hasColumn(this.tableName, 'item'))) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.integer('item').unsigned().nullable().after('date').comment(this.columnMarker)
      })

      await this.schema.raw(`
        UPDATE employee_verification_x_receipts AS target
        JOIN (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY receipt_id ORDER BY date, id) AS sequence_number
          FROM employee_verification_x_receipts
        ) AS ordered ON ordered.id = target.id
        SET target.item = ordered.sequence_number
      `)

      await this.schema.raw(`
        ALTER TABLE employee_verification_x_receipts
        MODIFY item INT UNSIGNED NOT NULL COMMENT '${this.columnMarker}'
      `)
    }

    if (!(await this.hasIndex('uniq_empver_x_rec_item')) && !(await this.hasIndex(this.indexName))) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.unique(['receipt_id', 'item'], this.indexName)
      })
    }
  }

  public async down () {
    if (await this.hasIndex(this.indexName)) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.dropUnique(['receipt_id', 'item'], this.indexName)
      })
    }

    const result = await Database.rawQuery(
      'SELECT COLUMN_COMMENT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [this.tableName, 'item']
    )
    if (result[0][0]?.COLUMN_COMMENT === this.columnMarker) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('item')
      })
    }
  }

  private async hasIndex(indexName: string): Promise<boolean> {
    const result = await Database.rawQuery(
      'SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1',
      [this.tableName, indexName]
    )
    return result[0].length > 0
  }
}
