import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'company_attachments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('companies_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('companies')
        .onUpdate('RESTRICT')
        .onDelete('CASCADE')
      table.string('description', 120).notNullable()
      table.string('original_name', 255).notNullable()
      table.string('file_name', 255).notNullable()
      table.string('mime_type', 120).nullable()
      table.string('extension', 10).notNullable()
      table.bigInteger('size').unsigned().nullable()
      table.string('drive_file_id', 200).notNullable()
      table.string('drive_folder_id', 200).notNullable()
      table.integer('uploaded_by').unsigned().nullable()
      table.timestamp('deleted_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.index(['companies_id', 'deleted_at'], 'company_attachments_company_deleted_idx')
      table.index(['drive_file_id'], 'company_attachments_drive_file_idx')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
