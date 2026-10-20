import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'spedy_service_invoices'

  public async up() {
    this.defer(async (db) => {
      if (!await db.schema.hasColumn(this.tableName, 'issued_on')) {
        await db.schema.alterTable(this.tableName, (table) => {
          table.dateTime('issued_on').nullable().after('processing_history')
        })
      }

      const [indexes] = await db.rawQuery(`
        SELECT INDEX_NAME FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
      `, [this.tableName, 'idx_spedy_nfse_company_issued_on'])
      if (!indexes.length) {
        await db.schema.alterTable(this.tableName, (table) => {
          table.index(['companies_id', 'issued_on'], 'idx_spedy_nfse_company_issued_on')
        })
      }

      await db.rawQuery(`
      UPDATE spedy_service_invoices
      SET issued_on = STR_TO_DATE(SUBSTRING(JSON_UNQUOTE(JSON_EXTRACT(response_payload, '$.issuedOn')), 1, 19), '%Y-%m-%dT%H:%i:%s')
      WHERE issued_on IS NULL AND JSON_VALID(response_payload)
        AND JSON_UNQUOTE(JSON_EXTRACT(response_payload, '$.issuedOn')) REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}'
      `)
    })
  }

  public async down() {
    this.defer(async (db) => {
      const [indexes] = await db.rawQuery(`
        SELECT INDEX_NAME FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
      `, [this.tableName, 'idx_spedy_nfse_company_issued_on'])
      if (indexes.length) {
        await db.schema.alterTable(this.tableName, (table) => {
          table.dropIndex(['companies_id', 'issued_on'], 'idx_spedy_nfse_company_issued_on')
        })
      }
      if (await db.schema.hasColumn(this.tableName, 'issued_on')) {
        await db.schema.alterTable(this.tableName, (table) => {
          table.dropColumn('issued_on')
        })
      }
    })
  }
}
