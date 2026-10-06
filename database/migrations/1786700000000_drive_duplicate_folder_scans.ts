import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'drive_duplicate_folder_scans'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('id').primary()
      table.string('status', 20).notNullable()
      table.string('run_token', 36).nullable()
      table.json('result').nullable()
      table.text('error_message').nullable()
      table.timestamp('started_at', { useTz: true }).nullable()
      table.timestamp('finished_at', { useTz: true }).nullable()
      table.timestamp('heartbeat_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
    this.defer(async (db) => {
      await db.table(this.tableName).insert({ id: 1, status: 'IDLE', created_at: new Date(), updated_at: new Date() })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
