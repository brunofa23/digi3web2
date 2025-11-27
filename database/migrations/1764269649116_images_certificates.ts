import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'image_certificates'

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
        .onDelete('RESTRICT')

      table
        .integer('book_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('books')
        .onUpdate('RESTRICT')
        .onDelete('RESTRICT')

      // 🔹 Uma FK por tipo de certificado (todas opcionais)
      table
        .integer('married_certificate_id')
        .unsigned()
        .references('id')
        .inTable('married_certificates')
        .onUpdate('RESTRICT')
        .onDelete('RESTRICT')
        .nullable()

      // table
      //   .integer('born_certificate_id')
      //   .unsigned()
      //   .references('id')
      //   .inTable('born_certificates')
      //   .onUpdate('RESTRICT')
      //   .onDelete('RESTRICT')
      //   .nullable()

      // Se quiser manter o antigo:
      // table.integer('certificate_id').notNullable()

      table.integer('seq').notNullable()

      table.string('ext', 5).nullable()
      table.string('file_name', 200).nullable()
      table.string('description', 50).nullable()
      table.string('path', 200).nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.index(['companies_id', 'book_id'], 'idx_imgcert_comp_book')
    })

  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
