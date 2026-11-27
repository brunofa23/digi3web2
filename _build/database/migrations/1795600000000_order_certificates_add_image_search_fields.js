"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'order_certificates';
    }
    async up() {
        const columns = [
            ['image_typebook_id', 'INT UNSIGNED NULL'],
            ['image_book', 'INT NULL'],
            ['image_sheet', 'INT NULL'],
            ['image_side', 'VARCHAR(50) NULL'],
            ['image_indexbook', 'INT NULL'],
            ['image_term', 'VARCHAR(255) NULL'],
        ];
        for (const [name, definition] of columns) {
            if (!(await this.schema.hasColumn(this.tableName, name))) {
                await Database_1.default.rawQuery(`ALTER TABLE ${this.tableName} ADD COLUMN ${name} ${definition}`);
            }
        }
        const foreignKey = await Database_1.default.rawQuery("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_certificates' AND CONSTRAINT_NAME = 'fk_order_cert_image_typebook_company' LIMIT 1");
        if (!foreignKey[0].length) {
            await Database_1.default.rawQuery(`
        ALTER TABLE ${this.tableName}
          ADD CONSTRAINT fk_order_cert_image_typebook_company
          FOREIGN KEY (image_typebook_id, companies_id)
          REFERENCES typebooks(id, companies_id)
          ON UPDATE RESTRICT ON DELETE RESTRICT
      `);
        }
        await Database_1.default.rawQuery(`
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
    `);
        await Database_1.default.rawQuery(`
      UPDATE order_certificates oc
      INNER JOIN secondcopy_certificates sc ON sc.id = oc.certificate_id
      SET oc.image_typebook_id = COALESCE(oc.image_typebook_id, sc.typebook_id),
          oc.image_book = COALESCE(oc.image_book, sc.book1),
          oc.image_sheet = COALESCE(oc.image_sheet, sc.sheet1),
          oc.image_term = COALESCE(oc.image_term, sc.term1)
      WHERE oc.book_id = 21
    `);
    }
    async down() {
        const foreignKey = await Database_1.default.rawQuery("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_certificates' AND CONSTRAINT_NAME = 'fk_order_cert_image_typebook_company' LIMIT 1");
        if (foreignKey[0].length) {
            await Database_1.default.rawQuery(`ALTER TABLE ${this.tableName} DROP FOREIGN KEY fk_order_cert_image_typebook_company`);
        }
        for (const name of [
            'image_typebook_id', 'image_book', 'image_sheet', 'image_side', 'image_indexbook', 'image_term',
        ]) {
            if (await this.schema.hasColumn(this.tableName, name)) {
                await Database_1.default.rawQuery(`ALTER TABLE ${this.tableName} DROP COLUMN ${name}`);
            }
        }
    }
}
exports.default = default_1;
default_1.disableTransactions = true;
//# sourceMappingURL=1795600000000_order_certificates_add_image_search_fields.js.map