import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximage_ocr_checks'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').notNullable().unsigned()
      table.integer('typebooks_id').notNullable().unsigned()
      table.integer('bookrecords_id').notNullable().unsigned()
      table.integer('seq').notNullable()
      table.string('layout_profile', 40).notNullable().defaultTo('header_keyword')
      table.integer('expected_sheet').nullable()
      table.integer('detected_sheet').nullable()
      table.string('expected_term', 60).nullable()
      table.string('detected_term', 60).nullable()
      table.string('sheet_status', 30).notNullable().defaultTo('not_found')
      table.string('term_status', 30).notNullable().defaultTo('not_found')
      table.decimal('confidence', 5, 4).nullable()
      table.string('confidence_level', 20).nullable()
      table.string('evidence_text', 500).nullable()
      table.string('source', 40).nullable()
      table.boolean('auto_applied').notNullable().defaultTo(false)
      table.string('review_status', 30).notNullable().defaultTo('pending')
      table.timestamp('processed_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(
        ['companies_id', 'typebooks_id', 'bookrecords_id', 'seq', 'layout_profile'],
        'idx_img_ocr_check_unique'
      )
      table.index(['companies_id', 'typebooks_id', 'bookrecords_id'], 'idx_img_ocr_check_record')
      table.index(['companies_id', 'typebooks_id', 'sheet_status'], 'idx_img_ocr_check_sheet')
      table.index(['companies_id', 'typebooks_id', 'term_status'], 'idx_img_ocr_check_term')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
