import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'indeximages'

  public async up () {
    for (const column of ['book', 'sheet', 'side']) {
      await this.dropColumnIfExists(column)
    }
  }

  public async down () {
    if (!(await this.hasColumn('book'))) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.integer('book').nullable().after('previous_file_name')
      })
    }

    if (!(await this.hasColumn('sheet'))) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.integer('sheet').nullable().after('book')
      })
    }

    if (!(await this.hasColumn('side'))) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.string('side', 5).nullable().after('sheet')
      })
    }
  }

  private async dropColumnIfExists(columnName: string) {
    if (!(await this.hasColumn(columnName))) return

    try {
      await this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn(columnName)
      })
    } catch (error) {
      if (!this.isMissingColumnError(error)) throw error
    }
  }

  private async hasColumn(columnName: string) {
    return this.schema.hasColumn(this.tableName, columnName)
  }

  private isMissingColumnError(error: unknown) {
    const databaseError = error as { code?: string; errno?: number; message?: string; sqlMessage?: string }
    const message = databaseError.sqlMessage || databaseError.message || ''

    return databaseError.code === 'ER_CANT_DROP_FIELD_OR_KEY'
      || databaseError.errno === 1091
      || message.includes("Can't DROP")
  }
}
