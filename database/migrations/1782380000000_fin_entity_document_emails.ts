import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'fin_entity_document_emails'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onDelete('CASCADE')
      table.integer('fin_entity_id').notNullable().unsigned().references('id').inTable('fin_entities').onDelete('CASCADE')
      table.string('email', 90).notNullable()
      table.string('subject', 200).notNullable()
      table.text('body')
      table.string('file_name', 200).notNullable()
      table.integer('file_size').defaultTo(0)
      table.string('status', 20).notNullable().defaultTo('sent')
      table.text('error_message')
      table.timestamp('sent_at', { useTz: true })
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.index(['companies_id', 'fin_entity_id'])
      table.index(['companies_id', 'created_at'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
