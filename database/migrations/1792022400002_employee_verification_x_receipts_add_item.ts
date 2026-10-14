import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class EmployeeVerificationXReceiptsAddItem extends BaseSchema {
  public static disableTransactions = true
  protected tableName = 'employee_verification_x_receipts'
  private readonly indexName = 'uniq_empver_x_rec_item_sequence'
  private readonly columnMarker = 'digi3_order_sequence_migration_1792022400002'

  public async up () {
    if (!(await this.hasColumn())) {
      await Database.rawQuery(`
        ALTER TABLE employee_verification_x_receipts
        ADD COLUMN item INT UNSIGNED NULL COMMENT '${this.columnMarker}' AFTER date
      `)

      await Database.rawQuery(`
        UPDATE employee_verification_x_receipts AS target
        JOIN (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY receipt_id ORDER BY date, id) AS sequence_number
          FROM employee_verification_x_receipts
        ) AS ordered ON ordered.id = target.id
        SET target.item = ordered.sequence_number
      `)

      await Database.rawQuery(`
        ALTER TABLE employee_verification_x_receipts
        MODIFY item INT UNSIGNED NOT NULL COMMENT '${this.columnMarker}'
      `)
    }

    if (!(await this.hasIndex('uniq_empver_x_rec_item')) && !(await this.hasIndex(this.indexName))) {
      await Database.rawQuery(`
        ALTER TABLE employee_verification_x_receipts
        ADD UNIQUE INDEX ${this.indexName} (receipt_id, item)
      `)
    }
  }

  public async down () {
    if (await this.hasIndex(this.indexName)) {
      await Database.rawQuery(`
        ALTER TABLE employee_verification_x_receipts DROP INDEX ${this.indexName}
      `)
    }

    const result = await Database.rawQuery(
      'SELECT COLUMN_COMMENT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [this.tableName, 'item']
    )
    if (result[0][0]?.COLUMN_COMMENT === this.columnMarker) {
      await Database.rawQuery('ALTER TABLE employee_verification_x_receipts DROP COLUMN item')
    }
  }

  private async hasColumn(): Promise<boolean> {
    const result = await Database.rawQuery(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1',
      [this.tableName, 'item']
    )
    return result[0].length > 0
  }

  private async hasIndex(indexName: string): Promise<boolean> {
    const result = await Database.rawQuery(
      'SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1',
      [this.tableName, indexName]
    )
    return result[0].length > 0
  }
}
