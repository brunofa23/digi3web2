import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'married_certificates'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('typebook_id')
        .nullable()
        .unsigned()
        .references('id')
        .inTable('typebooks')
        .onUpdate('RESTRICT')
        .onDelete('RESTRICT')
        .after('status_id')

      table.integer('book1').nullable().after('dthr_divorce_spouse2')
      table.integer('sheet1').nullable().after('book1')
      table.string('term1').nullable().after('sheet1')

      table
        .integer('typebook_id2')
        .nullable()
        .unsigned()
        .references('id')
        .inTable('typebooks')
        .onUpdate('RESTRICT')
        .onDelete('RESTRICT')
        .after('typebook_id')

      table.integer('book2').nullable().after('term1')
      table.integer('sheet2').nullable().after('book2')
      table.string('term2').nullable().after('sheet2')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      // 🔻 primeiro remove as constraints de FK
      table.dropForeign(['typebook_id'])
      table.dropForeign(['typebook_id2'])

      // 🔻 depois remove as colunas
      table.dropColumns(
        'typebook_id',
        'book1',
        'sheet1',
        'term1',
        'typebook_id2',
        'book2',
        'sheet2',
        'term2'
      )
    })
  }
}
