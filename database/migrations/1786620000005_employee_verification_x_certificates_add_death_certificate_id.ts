import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  protected tableName = 'employee_verification_x_certificates'

  public async up () {
    if (!(await this.hasColumn('death_certificate_id'))) {
      try {
        await this.schema.raw(`
          ALTER TABLE ${this.tableName}
          ADD COLUMN death_certificate_id INT UNSIGNED NULL AFTER born_certificate_id
        `)
      } catch (error) {
        const errorCode = (error as any)?.code
        const errorNumber = (error as any)?.errno
        if (errorCode !== 'ER_DUP_FIELDNAME' && errorNumber !== 1060) throw error
      }
    }

    if (!(await this.hasForeignKey('fk_empver_x_cert_death'))) {
      try {
        await this.schema.raw(`
          ALTER TABLE ${this.tableName}
          ADD CONSTRAINT fk_empver_x_cert_death
            FOREIGN KEY (death_certificate_id)
            REFERENCES death_certificates(id)
            ON UPDATE RESTRICT
            ON DELETE RESTRICT
        `)
      } catch (error) {
        const errorCode = (error as any)?.code
        const errorNumber = (error as any)?.errno
        if (errorCode !== 'ER_FK_DUP_NAME' && errorNumber !== 1826) throw error
      }
    }

    if (!(await this.hasIndex('uniq_empver_x_cert_death'))) {
      await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        ADD UNIQUE INDEX uniq_empver_x_cert_death
          (death_certificate_id, employee_verification_id)
      `)
    }

    if (!(await this.hasIndex('idx_empver_x_cert_comp_death'))) {
      await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        ADD INDEX idx_empver_x_cert_comp_death
          (companies_id, death_certificate_id)
      `)
    }
  }

  public async down () {
    if (await this.hasForeignKey('fk_empver_x_cert_death')) {
      await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        DROP FOREIGN KEY fk_empver_x_cert_death
      `)
    }

    if (await this.hasIndex('uniq_empver_x_cert_death')) {
      await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        DROP INDEX uniq_empver_x_cert_death
      `)
    }

    if (await this.hasIndex('idx_empver_x_cert_comp_death')) {
      await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        DROP INDEX idx_empver_x_cert_comp_death
      `)
    }

    if (await this.hasColumn('death_certificate_id')) {
      await this.schema.raw(`
        ALTER TABLE ${this.tableName}
        DROP COLUMN death_certificate_id
      `)
    }
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
}
