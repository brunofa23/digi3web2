import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected batchesTable = 'drive_deletion_batches'
  protected itemsTable = 'drive_deletion_items'

  public async up () {
    this.schema.createTable(this.batchesTable, (table) => {
      table.bigIncrements('id')
      table.integer('companies_id').unsigned().notNullable()
      table.integer('typebooks_id').unsigned().notNullable()
      table.integer('user_id').unsigned().nullable()
      table.string('action', 30).notNullable()
      table.string('status', 20).notNullable().defaultTo('pending')
      table.integer('book').unsigned().notNullable()
      table.integer('start_cod').unsigned().notNullable()
      table.integer('end_cod').unsigned().notNullable()
      table.integer('total_items').unsigned().notNullable().defaultTo(0)
      table.integer('processed_items').unsigned().notNullable().defaultTo(0)
      table.integer('failed_items').unsigned().notNullable().defaultTo(0)
      table.text('last_error').nullable()
      table.timestamp('started_at').nullable()
      table.timestamp('finished_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index(['companies_id', 'status'], 'drive_deletion_batches_company_status_idx')
      table.index(['typebooks_id', 'book', 'start_cod', 'end_cod'], 'drive_deletion_batches_filter_idx')
    })

    this.schema.createTable(this.itemsTable, (table) => {
      table.bigIncrements('id')
      table.bigInteger('batch_id').unsigned().notNullable()
      table.integer('companies_id').unsigned().notNullable()
      table.integer('typebooks_id').unsigned().notNullable()
      table.bigInteger('bookrecords_id').unsigned().notNullable()
      table.integer('seq').unsigned().notNullable()
      table.string('drive_file_id', 200).nullable()
      table.string('file_name', 500).nullable()
      table.string('status', 20).notNullable().defaultTo('pending')
      table.integer('attempts').unsigned().notNullable().defaultTo(0)
      table.text('last_error').nullable()
      table.timestamp('processed_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.foreign('batch_id').references('id').inTable(this.batchesTable)
      table.unique(['batch_id', 'bookrecords_id', 'seq'], 'drive_deletion_items_batch_record_seq_uq')
      table.index(['status', 'attempts'], 'drive_deletion_items_status_attempts_idx')
      table.index(['companies_id', 'typebooks_id', 'bookrecords_id'], 'drive_deletion_items_record_idx')
    })
  }

  public async down () {
    this.schema.dropTable(this.itemsTable)
    this.schema.dropTable(this.batchesTable)
  }
}
