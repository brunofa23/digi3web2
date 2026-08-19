import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximage_ocr_entities'

  public async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.string('normalized_hash', 64).nullable().after('normalized_value')
      table.index(['companies_id', 'typebooks_id', 'entity_type', 'normalized_hash'], 'idx_img_ocr_entities_type_hash')
      table.index(['companies_id', 'typebooks_id', 'bookrecords_id', 'entity_type'], 'idx_img_ocr_entities_record_type')
    })
  }

  public async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['companies_id', 'typebooks_id', 'entity_type', 'normalized_hash'], 'idx_img_ocr_entities_type_hash')
      table.dropIndex(['companies_id', 'typebooks_id', 'bookrecords_id', 'entity_type'], 'idx_img_ocr_entities_record_type')
      table.dropColumn('normalized_hash')
    })
  }
}
