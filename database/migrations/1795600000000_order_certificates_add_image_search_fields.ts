import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  public static disableTransactions = true
  protected tableName = 'order_certificates'

  public async up() {
    await Database.rawQuery(`
      ALTER TABLE ${this.tableName}
        ADD COLUMN image_typebook_id INT UNSIGNED NULL,
        ADD COLUMN image_book INT NULL,
        ADD COLUMN image_sheet INT NULL,
        ADD COLUMN image_side VARCHAR(50) NULL,
        ADD COLUMN image_indexbook INT NULL,
        ADD COLUMN image_term VARCHAR(255) NULL,
        ADD CONSTRAINT fk_order_cert_image_typebook
          FOREIGN KEY (image_typebook_id) REFERENCES typebooks(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT
    `)

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
    await Database.rawQuery(`
      ALTER TABLE ${this.tableName}
        DROP FOREIGN KEY fk_order_cert_image_typebook,
        DROP COLUMN image_typebook_id,
        DROP COLUMN image_book,
        DROP COLUMN image_sheet,
        DROP COLUMN image_side,
        DROP COLUMN image_indexbook,
        DROP COLUMN image_term
    `)
  }
}
