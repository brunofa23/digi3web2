import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class EmolumentService extends BaseSchema {
  protected tableName = 'emolument_service' // nome da pivô

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // (Opcional, mas RECOMENDADO no seu caso) para reforçar multi-tenant por empresa
      table
        .integer('companies_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('companies')
        .onUpdate('RESTRICT')
        .onDelete('RESTRICT')

      table
        .integer('service_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('services')
        .onUpdate('RESTRICT')
        .onDelete('CASCADE')

      table
        .integer('emolument_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('emoluments')
        .onUpdate('RESTRICT')
        .onDelete('CASCADE')

      // evita duplicar o mesmo vínculo dentro da mesma empresa
      table.unique(['companies_id', 'service_id', 'emolument_id'])

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
