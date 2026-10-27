import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximage_side_labels'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').unsigned().notNullable()
      table.integer('typebooks_id').unsigned().notNullable()
      table.integer('bookrecords_id').unsigned().notNullable()
      table.integer('seq').notNullable()
      table.integer('position').unsigned().notNullable()
      table.string('drive_file_id', 120).notNullable()
      table.string('file_name', 200).notNullable()
      table.string('label', 1).nullable()
      table.integer('reviewed_by').unsigned().nullable()
      table.timestamp('reviewed_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.unique(['companies_id', 'typebooks_id', 'bookrecords_id', 'seq'], 'idx_side_label_image')
      table.unique(['companies_id', 'typebooks_id', 'position'], 'idx_side_label_position')
      table.index(['companies_id', 'typebooks_id', 'label'], 'idx_side_label_progress')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
