import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'sales_opportunity_activities'

  public async up () {
    this.schema.alterTable('sales_opportunities', (table) => {
      table.text('next_action').nullable().after('next_contact_date')
      table.integer('assigned_user_id').unsigned().nullable().references('id').inTable('users').onUpdate('RESTRICT').onDelete('SET NULL')
      table.string('email', 255).nullable().after('phone')
      table.string('whatsapp', 30).nullable().after('email')
      table.string('state', 2).nullable().after('city')
      table.string('source', 80).nullable().after('interest')
      table.index(['assigned_user_id', 'next_contact_date'], 'sales_opportunities_follow_up_idx')
    })

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('sales_opportunity_id').unsigned().notNullable().references('id').inTable('sales_opportunities').onUpdate('RESTRICT').onDelete('CASCADE')
      table.string('type', 30).notNullable()
      table.text('description').notNullable()
      table.dateTime('activity_date').notNullable()
      table.integer('user_id').unsigned().nullable().references('id').inTable('users').onUpdate('RESTRICT').onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.index(['sales_opportunity_id', 'activity_date'], 'sales_activities_opportunity_date_idx')
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
    this.schema.alterTable('sales_opportunities', (table) => {
      table.dropIndex(['assigned_user_id', 'next_contact_date'], 'sales_opportunities_follow_up_idx')
      table.dropColumn('next_action')
      table.dropColumn('assigned_user_id')
      table.dropColumn('email')
      table.dropColumn('whatsapp')
      table.dropColumn('state')
      table.dropColumn('source')
    })
  }
}
