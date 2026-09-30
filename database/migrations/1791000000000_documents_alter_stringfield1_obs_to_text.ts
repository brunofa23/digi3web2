import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  public async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex('obs')
    })

    await this.schema.alterTable(this.tableName, (table) => {
      table.text('stringfield1').alter()
      table.text('obs').nullable().alter()
    })

    await this.schema.raw(
      'CREATE INDEX `documents_obs_index` ON `documents` (`obs`(191))'
    )
  }

  public async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex('obs')
    })

    await this.schema.alterTable(this.tableName, (table) => {
      table.string('stringfield1', 350).alter()
      table.string('obs', 350).nullable().alter()
    })

    await this.schema.alterTable(this.tableName, (table) => {
      table.index('obs')
    })
  }
}
