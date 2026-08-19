import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximage_ocr_entities'

  public async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').notNullable().unsigned()
      table.integer('typebooks_id').notNullable().unsigned()
      table.integer('bookrecords_id').notNullable().unsigned()
      table.integer('seq').notNullable()
      table.string('entity_type', 30).notNullable()
      table.string('value', 255).notNullable()
      table.string('normalized_value', 255).notNullable()
      table.decimal('confidence', 5, 4).nullable()
      table.string('source', 40).nullable()
      table.string('evidence_text', 500).nullable()
      table.json('position_json').nullable()
      table.string('review_status', 30).notNullable().defaultTo('pending')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.index(['companies_id', 'typebooks_id', 'bookrecords_id', 'seq'], 'idx_img_ocr_entities_image')
      table.index(['companies_id', 'typebooks_id', 'entity_type'], 'idx_img_ocr_entities_type')
      table.index(['companies_id', 'typebooks_id', 'normalized_value'], 'idx_img_ocr_entities_value')
    })
  }

  public async down() {
    await this.schema.dropTable(this.tableName)
  }
}
