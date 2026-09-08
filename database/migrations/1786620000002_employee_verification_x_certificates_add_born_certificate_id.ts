import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class EmployeeVerificationXCertificatesAddBornCertificateId extends BaseSchema {
  protected tableName = 'employee_verification_x_certificates'

  public async up () {
    if (await this.hasColumn('born_certificate_id')) {
      await this.addMarriedForeignKeyIfMissing()
      return
    }

    await this.addMarriedForeignKeyIfMissing()

    await this.schema.raw(`
      ALTER TABLE ${this.tableName}
      MODIFY married_certificate_id INT UNSIGNED NULL
    `)

    await this.schema.raw(`
      ALTER TABLE ${this.tableName}
      ADD COLUMN born_certificate_id INT UNSIGNED NULL AFTER married_certificate_id,
      ADD CONSTRAINT fk_empver_x_cert_born
        FOREIGN KEY (born_certificate_id)
        REFERENCES born_certificates(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,
      ADD UNIQUE INDEX uniq_empver_x_cert_born
        (born_certificate_id, employee_verification_id),
      ADD INDEX idx_empver_x_cert_comp_born
        (companies_id, born_certificate_id)
    `)
  }

  public async down () {
    await this.dropForeignKeyIfExists('fk_empver_x_cert_married')
    await this.dropForeignKeyIfExists('fk_empver_x_cert_born')
    await this.dropIndexIfExists('idx_empver_x_cert_comp_born')
    await this.dropIndexIfExists('uniq_empver_x_cert_born')
    await this.dropIndexIfExists('uniq_empver_x_cert_married')

    if (await this.hasColumn('born_certificate_id')) {
      await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        DROP COLUMN born_certificate_id
      `)
    }

    await this.schema.raw(`
      ALTER TABLE ${this.tableName}
      MODIFY married_certificate_id INT UNSIGNED NOT NULL
    `)

    if (!(await this.hasIndex('uniq_empver_x_cert'))) {
      await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        ADD UNIQUE INDEX uniq_empver_x_cert
          (married_certificate_id, employee_verification_id)
      `)
    }

    await this.addMarriedForeignKeyIfMissing()
  }

  private async dropForeignKeyIfExists(constraintName: string) {
    if (!(await this.hasForeignKey(constraintName))) return

    await this.schema.raw(`
      ALTER TABLE ${this.tableName}
      DROP FOREIGN KEY ${constraintName}
    `)
  }

  private async dropIndexIfExists(indexName: string) {
    const result = await Database.rawQuery(
      `
        SELECT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
        LIMIT 1
      `,
      [this.tableName, indexName]
    )

    if (!result[0].length) return

    try {
      await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        DROP INDEX ${indexName}
      `)
    } catch (error) {
      const errorCode = (error as any)?.code
      const errorNumber = (error as any)?.errno
      if (errorCode !== 'ER_CANT_DROP_FIELD_OR_KEY' && errorNumber !== 1091) {
        throw error
      }
    }
  }

  private async hasIndex(indexName: string) {
    const result = await Database.rawQuery(
      `
        SELECT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
        LIMIT 1
      `,
      [this.tableName, indexName]
    )

    return result[0].length > 0
  }

  private async hasColumn(columnName: string) {
    const result = await Database.rawQuery(
      `
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
        LIMIT 1
      `,
      [this.tableName, columnName]
    )

    return result[0].length > 0
  }

  private async hasForeignKey(constraintName: string) {
    const result = await Database.rawQuery(
      `
        SELECT CONSTRAINT_NAME
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND CONSTRAINT_NAME = ?
          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        LIMIT 1
      `,
      [this.tableName, constraintName]
    )

    return result[0].length > 0
  }

  private async addMarriedForeignKeyIfMissing() {
    if (await this.hasForeignKey('fk_empver_x_cert_married')) return

    try {
      await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        ADD CONSTRAINT fk_empver_x_cert_married
          FOREIGN KEY (married_certificate_id)
          REFERENCES married_certificates(id)
          ON UPDATE RESTRICT
          ON DELETE RESTRICT
      `)
    } catch (error) {
      const errorCode = (error as any)?.code
      const errorNumber = (error as any)?.errno
      if (errorCode !== 'ER_FK_DUP_NAME' && errorNumber !== 1826) {
        throw error
      }
    }
  }
}
