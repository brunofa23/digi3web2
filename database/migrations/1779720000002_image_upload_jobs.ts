import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'image_upload_jobs'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').notNullable().index()
      table.integer('typebooks_id').nullable().index()
      table.string('status', 40).notNullable().index()
      table.string('source', 40).nullable()
      table.text('file_names').nullable()
      table.text('data_images').nullable()
      table.text('result_files').nullable()
      table.text('error_message').nullable()
      table.timestamps(true)
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
