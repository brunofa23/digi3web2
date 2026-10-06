import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('receipts', (table) => {
      table.string('applicant', 100).nullable().alter()
      table.string('registered1', 255).nullable().alter()
    })
  }

  public async down() {
    const longerName = await Database.from('receipts')
      .whereRaw('CHAR_LENGTH(applicant) > 90 OR CHAR_LENGTH(registered1) > 90')
      .first()
    if (longerName) throw new Error('Há recibos com nomes acima de 90 caracteres; a reversão truncaria dados')
    this.schema.alterTable('receipts', (table) => {
      table.string('applicant', 90).nullable().alter()
      table.string('registered1', 90).nullable().alter()
    })
  }
}
