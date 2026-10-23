import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximage_ocr_checks'

  public async up() {
    for (const column of ['detected_side', 'side_confidence', 'side_evidence', 'side_processed_at']) {
      if (await this.schema.hasColumn(this.tableName, column)) continue

      try {
        await this.schema.alterTable(this.tableName, (table) => {
          if (column === 'detected_side') table.string(column, 1).nullable().after('processed_at')
          if (column === 'side_confidence') table.decimal(column, 5, 4).nullable().after('detected_side')
          if (column === 'side_evidence') table.string(column, 120).nullable().after('side_confidence')
          if (column === 'side_processed_at') table.timestamp(column, { useTz: true }).nullable().after('side_evidence')
        })
      } catch (error) {
        const databaseError = error as { code?: string; errno?: number }
        if (databaseError.code !== 'ER_DUP_FIELDNAME' && databaseError.errno !== 1060) throw error
      }
    }
  }

  public async down() {
    // As colunas já existiam em alguns bancos antes desta migration; preservá-las evita perda de dados.
  }
}
