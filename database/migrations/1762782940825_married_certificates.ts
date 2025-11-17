import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'married_certificates'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('RESTRICT')

      table.integer('groom_person_id').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT')
      table.integer('father_groom_person_id').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT')
      table.integer('mother_groom_person_id').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT')

      table.integer('bride_person_id').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT')
      table.integer('fahter_bride_person_id').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT')
      table.integer('mother_bride_person_id').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT')

      table.integer('witness_person_id').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT')
      table.integer('witness2_person_id').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT')

      table.integer('usr_id').unsigned().notNullable().references('users.id').onDelete('RESTRICT').onUpdate('RESTRICT')
      table.integer('status_id').unsigned().nullable().references('statuses.id').onDelete('SET NULL').onUpdate('SET NULL')

      table.dateTime('dthr_schedule')
      table.dateTime('dthr_marriage')

      table.string('type')
      table.text('obs')

      table.string('church_name')
      table.string('church_city')

      table.string('marital_regime')

      table.boolean('prenup').defaultTo(false)

      table.string('registry_office_prenup')
      table.string('addres_registry_office_prenup')

      table.integer('book_registry_office_prenup').unsigned()
      table.integer('sheet_registry_office_prenup').unsigned()

      table.date('dthr_prenup')

      table.string('cerimony_location')
      table.string('other_cerimony_location')

      table.string('name_former_spouse') //ex conjuge
      table.date('dthr_divorce_spouse') //data do divorcio ex conjuge

      table.string('name_former_spouse2')
      table.date('dthr_divorce_spouse2')

      table.boolean('inactive').defaultTo(false)
      table.string('status_form',10).notNullable()

      // timestamps padrão
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
