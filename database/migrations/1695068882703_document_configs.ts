import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'document_configs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('typebooks_id').notNullable().unsigned().references('typebooks.id').onDelete('CASCADE').onUpdate('CASCADE')
      table.integer('companies_id').notNullable().unsigned().references('typebooks.companies_id').onDelete('CASCADE').onUpdate('CASCADE')


      table.string('box')
      table.string('prot')
      table.string('month')
      table.string('yeardoc')

      table.string('intfield1')
      table.string('stringfield1')
      table.string('datefield1')

      table.string('intfield2')
      table.string('stringfield2')
      table.string('datefield2')

      table.string('intfield3')
      table.string('stringfield3')
      table.string('datefield3')

      table.string('intfield4')
      table.string('stringfield4')
      table.string('datefield4')

      table.string('intfield5')
      table.string('stringfield5')
      table.string('datefield5')

      table.string('intfield6')
      table.string('stringfield6')
      table.string('datefield6')

      table.string('intfield7')
      table.string('stringfield7')
      table.string('datefield7')

      table.string('intfield8')
      table.string('stringfield8')
      table.string('datefield8')

      table.string('intfield9')
      table.string('stringfield9')
      table.string('datefield9')

      table.string('intfield10')
      table.string('stringfield10')
      table.string('datefield10')

      table.string('intfield11')
      table.string('stringfield11')
      table.string('datefield11')

      table.string('intfield12')
      table.string('stringfield12')
      table.string('datefield12')

      table.string('intfield13')
      table.string('stringfield13')
      table.string('datefield13')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
