import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'born_certificates'

  public async up() {
    this.defer(async (db) => {
      const columns = [
        'supposed_father_person_id',
        'supposed_father_enabled',
        'supposed_father_name_altered',
        'supposed_father_other_occupation',
        'supposed_father_birth_state',
        'supposed_father_birth_city',
        'supposed_father_has_residence',
        'supposed_father_residence_subdistrict',
      ]
      const missing = new Set<string>()
      for (const column of columns) {
        if (!(await db.schema.hasColumn(this.tableName, column))) missing.add(column)
      }
      if (!missing.size) return

      await db.schema.alterTable(this.tableName, (table) => {
        if (missing.has('supposed_father_person_id')) {
          table.integer('supposed_father_person_id').unsigned().nullable().after('status_form')
            .references('people.id').onUpdate('RESTRICT').onDelete('RESTRICT')
        }
        if (missing.has('supposed_father_enabled')) table.boolean('supposed_father_enabled').notNullable().defaultTo(false).after('status_form')
        if (missing.has('supposed_father_name_altered')) table.boolean('supposed_father_name_altered').notNullable().defaultTo(false).after('status_form')
        if (missing.has('supposed_father_other_occupation')) table.boolean('supposed_father_other_occupation').notNullable().defaultTo(false).after('status_form')
        if (missing.has('supposed_father_birth_state')) table.string('supposed_father_birth_state', 2).nullable().after('status_form')
        if (missing.has('supposed_father_birth_city')) table.string('supposed_father_birth_city', 100).nullable().after('status_form')
        if (missing.has('supposed_father_has_residence')) table.boolean('supposed_father_has_residence').notNullable().defaultTo(false).after('status_form')
        if (missing.has('supposed_father_residence_subdistrict')) table.string('supposed_father_residence_subdistrict', 90).nullable().after('status_form')
      })
    })
  }

  public async down() {
    this.defer(async (db) => {
      await db.schema.alterTable(this.tableName, (table) => {
        table.dropForeign(['supposed_father_person_id'])
        table.dropColumn('supposed_father_person_id')
        table.dropColumn('supposed_father_enabled')
        table.dropColumn('supposed_father_name_altered')
        table.dropColumn('supposed_father_other_occupation')
        table.dropColumn('supposed_father_birth_state')
        table.dropColumn('supposed_father_birth_city')
        table.dropColumn('supposed_father_has_residence')
        // Esta coluna já existia em bancos anteriores; não removê-la no rollback.
      })
    })
  }
}
