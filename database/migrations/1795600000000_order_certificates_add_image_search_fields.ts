import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  public static disableTransactions = true
  protected tableName = 'order_certificates'

  public async up() {
    const columns = [
      ['image_typebook_id', 'INT UNSIGNED NULL'],
      ['image_book', 'INT NULL'],
      ['image_sheet', 'INT NULL'],
      ['image_side', 'VARCHAR(50) NULL'],
      ['image_indexbook', 'INT NULL'],
      ['image_term', 'VARCHAR(255) NULL'],
    ] as const

    for (const [name, definition] of columns) {
      if (!(await this.schema.hasColumn(this.tableName, name))) {
        await Database.rawQuery(`ALTER TABLE ${this.tableName} ADD COLUMN ${name} ${definition}`)
      }
    }

    const foreignKey = await Database.rawQuery(
      "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_certificates' AND CONSTRAINT_NAME = 'fk_order_cert_image_typebook_company' LIMIT 1"
    )
    if (!foreignKey[0].length) {
      await Database.rawQuery(`
        ALTER TABLE ${this.tableName}
          ADD CONSTRAINT fk_order_cert_image_typebook_company
          FOREIGN KEY (image_typebook_id, companies_id)
          REFERENCES typebooks(id, companies_id)
          ON UPDATE RESTRICT ON DELETE RESTRICT
      `)
    }

    await Database.rawQuery(`
      UPDATE order_certificates oc
      INNER JOIN (
        SELECT r.*
        FROM receipts r
        INNER JOIN (
          SELECT order_certificate_id, MIN(id) AS id
          FROM receipts
          GROUP BY order_certificate_id
        ) first_receipt ON first_receipt.id = r.id
      ) r ON r.order_certificate_id = oc.id
      SET oc.image_typebook_id = r.typebook_id,
          oc.image_book = r.book,
          oc.image_sheet = r.sheet,
          oc.image_side = r.side
    `)

    await Database.rawQuery(`
      UPDATE order_certificates oc
      INNER JOIN secondcopy_certificates sc ON sc.id = oc.certificate_id
      SET oc.image_typebook_id = COALESCE(oc.image_typebook_id, sc.typebook_id),
          oc.image_book = COALESCE(oc.image_book, sc.book1),
          oc.image_sheet = COALESCE(oc.image_sheet, sc.sheet1),
          oc.image_term = COALESCE(oc.image_term, sc.term1)
      WHERE oc.book_id = 21
    `)
  }

  public async down() {
    const foreignKey = await Database.rawQuery(
      "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_certificates' AND CONSTRAINT_NAME = 'fk_order_cert_image_typebook_company' LIMIT 1"
    )
    if (foreignKey[0].length) {
      await Database.rawQuery(`ALTER TABLE ${this.tableName} DROP FOREIGN KEY fk_order_cert_image_typebook_company`)
    }

    for (const name of [
      'image_typebook_id', 'image_book', 'image_sheet', 'image_side', 'image_indexbook', 'image_term',
    ]) {
      if (await this.schema.hasColumn(this.tableName, name)) {
        await Database.rawQuery(`ALTER TABLE ${this.tableName} DROP COLUMN ${name}`)
      }
    }
  }
}
