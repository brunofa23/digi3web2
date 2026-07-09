import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class EmployeeVerificationsIdAutoIncrement extends BaseSchema {
  protected tableName = 'employee_verifications'

  public async up () {
    await this.dropForeignIfExists(
      'employee_verification_x_receipts',
      'fk_empver_x_rec_empver_id'
    )
    await this.dropForeignIfExists(
      'employee_verification_x_certificates',
      'fk_empver_x_cert_empver_id'
    )

    await this.schema.raw(`
      ALTER TABLE ${this.tableName}
      MODIFY id INT UNSIGNED NOT NULL AUTO_INCREMENT
    `)

    await this.addEmployeeVerificationForeign(
      'employee_verification_x_receipts',
      'fk_empver_x_rec_empver_id'
    )
    await this.addEmployeeVerificationForeign(
      'employee_verification_x_certificates',
      'fk_empver_x_cert_empver_id'
    )
  }

  public async down () {
    await this.dropForeignIfExists(
      'employee_verification_x_receipts',
      'fk_empver_x_rec_empver_id'
    )
    await this.dropForeignIfExists(
      'employee_verification_x_certificates',
      'fk_empver_x_cert_empver_id'
    )

    await this.schema.raw(`
      ALTER TABLE ${this.tableName}
      MODIFY id INT UNSIGNED NOT NULL
    `)

    await this.addEmployeeVerificationForeign(
      'employee_verification_x_receipts',
      'fk_empver_x_rec_empver_id'
    )
    await this.addEmployeeVerificationForeign(
      'employee_verification_x_certificates',
      'fk_empver_x_cert_empver_id'
    )
  }

  private async dropForeignIfExists(tableName: string, foreignName: string) {
    const hasForeign = await this.hasForeign(tableName, foreignName)
    if (!hasForeign) return

    await this.schema.raw(`
      ALTER TABLE ${tableName}
      DROP FOREIGN KEY ${foreignName}
    `)
  }

  private async addEmployeeVerificationForeign(tableName: string, foreignName: string) {
    const hasTable = await this.schema.hasTable(tableName)
    if (!hasTable) return

    const hasForeign = await this.hasForeign(tableName, foreignName)
    if (hasForeign) return

    await this.schema.raw(`
      ALTER TABLE ${tableName}
      ADD CONSTRAINT ${foreignName}
      FOREIGN KEY (employee_verification_id)
      REFERENCES ${this.tableName}(id)
      ON UPDATE RESTRICT
      ON DELETE RESTRICT
    `)
  }

  private async hasForeign(tableName: string, foreignName: string) {
    const result = await Database.rawQuery(
      `
        SELECT CONSTRAINT_NAME
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND CONSTRAINT_NAME = ?
          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      `,
      [tableName, foreignName]
    )

    return result[0].length > 0
  }
}
