import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('companies_id').unsigned().nullable().references('id').inTable('companies').onDelete('SET NULL')
      table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.string('action', 60).notNullable()
      table.string('entity_table', 60).nullable()
      table.integer('entity_id').unsigned().nullable()
      table.string('resource_key', 255).nullable()
      table.json('entity_key').nullable()
      table.string('description', 500).nullable()
      table.json('metadata').nullable()
      table.json('changed_fields').nullable()
      table.json('before_data').nullable()
      table.json('after_data').nullable()
      table.integer('occurrence_count').unsigned().notNullable().defaultTo(1)
      table.timestamp('first_at', { useTz: true }).nullable()
      table.timestamp('last_at', { useTz: true }).nullable()
      table.string('ip', 45).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      table.index(['companies_id', 'created_at'], 'audit_logs_company_created_idx')
      table.index(['user_id', 'created_at'], 'audit_logs_user_created_idx')
      table.index(['action', 'created_at'], 'audit_logs_action_created_idx')
      table.index(['entity_table', 'entity_id'], 'audit_logs_entity_idx')
      table.index(['resource_key'], 'audit_logs_resource_key_idx')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
