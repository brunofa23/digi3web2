import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'people'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      // === Dados pessoais ===
      table.string('name', 90)
      table.string('name_married', 90)
      table.string('cpf', 11).unique().index()
      table.string('gender', 1)
      table.boolean('deceased').defaultTo(false)
      table.date('date_birth') // troque para dateTime se precisar de hora
      table.string('marital_status', 15)
      table.boolean('illiterate').defaultTo(false)

      // Naturalidade / Nacionalidade / Profissão
      table.string('place_birth', 100) // ou usar FK para tabela de cidades
      table.string('nationality', 50)
      // Se optar por tabela de ocupações, crie occupation_id (exemplo comentado):
      table.integer('occupation_id').nullable().unsigned().references('id').inTable('occupations').onDelete('SET NULL')
      //table.string('occupation', 100)

      // === Endereço ===
      table.string('zip_code', 15)
      table.string('address', 150)
      table.string('street_number', 5)
      table.string('street_complement', 10)
      table.string('district', 100) // bairro
      table.string('city', 100)
      table.string('state', 2)

      // === Documento ===
      table.string('document_type', 50)
      table.string('document_number', 50).index()

      // === Contatos ===
      table.string('phone', 15)
      table.string('cellphone', 15)
      table.string('email', 90).index()
      table.boolean('inactive').defaultTo('false')

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
