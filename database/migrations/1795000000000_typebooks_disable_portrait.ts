import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'typebook_settings'

  public async up() {
    await this.schema.raw(`
      CREATE TABLE IF NOT EXISTS typebook_settings (
        typebooks_id INT UNSIGNED NOT NULL,
        disable_portrait BOOLEAN NOT NULL DEFAULT FALSE,
        PRIMARY KEY (typebooks_id)
      ) ENGINE=InnoDB
    `)
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
