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

      table.integer('certificate_id').notNullable()
      table.integer('seq').notNullable()

      table.string('ext', 5).nullable()
      table.string('file_name', 200).nullable()

      // ✅ aqui faltava o "()"
      table.string('description', 50).nullable()

      table.string('path', 200).nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // ✅ índice composto (mais útil pra buscas por essas 3 juntas)
      table.index(['companies_id', 'book_id', 'certificate_id'], 'idx_imgcert_comp_book_cert')

      // (opcional) índices individuais, se você filtra por uma só coluna às vezes
      // table.index(['companies_id'], 'idx_imgcert_comp')
      // table.index(['book_id'], 'idx_imgcert_book')
      // table.index(['certificate_id'], 'idx_imgcert_cert')

      // (bem recomendado) garantir que não repita a mesma seq dentro do mesmo certificado
      table.unique(
        ['companies_id', 'book_id', 'certificate_id', 'seq'],
        'uq_imgcert_comp_book_cert_seq'
      )
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
