import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'spedy_nfse_export_jobs'

  public async up() {
    this.defer(async (db) => {
      if (await db.schema.hasTable(this.tableName)) return

      await db.schema.createTable(this.tableName, (table) => {
        table.increments('id')
        table.integer('companies_id').unsigned().notNullable().index()
        table.integer('user_id').unsigned().notNullable().index()
        table.string('format', 3).notNullable()
        table.string('status', 20).notNullable().index()
        table.integer('total').unsigned().notNullable()
        table.integer('processed').unsigned().notNullable().defaultTo(0)
        table.text('invoice_ids').notNullable()
        table.text('failures', 'longtext').nullable()
        table.string('file_name', 150).nullable()
        table.text('error_message').nullable()
        table.timestamps(true)
      })
    })
  }

  public async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
