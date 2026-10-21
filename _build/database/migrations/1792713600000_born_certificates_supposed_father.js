"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'born_certificates';
    }
    async up() {
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
            ];
            const missing = new Set();
            for (const column of columns) {
                if (!(await db.schema.hasColumn(this.tableName, column)))
                    missing.add(column);
            }
            if (!missing.size)
                return;
            await db.schema.alterTable(this.tableName, (table) => {
                if (missing.has('supposed_father_person_id')) {
                    table.integer('supposed_father_person_id').unsigned().nullable().after('status_form')
                        .references('people.id').onUpdate('RESTRICT').onDelete('RESTRICT');
                }
                if (missing.has('supposed_father_enabled'))
                    table.boolean('supposed_father_enabled').notNullable().defaultTo(false).after('status_form');
                if (missing.has('supposed_father_name_altered'))
                    table.boolean('supposed_father_name_altered').notNullable().defaultTo(false).after('status_form');
                if (missing.has('supposed_father_other_occupation'))
                    table.boolean('supposed_father_other_occupation').notNullable().defaultTo(false).after('status_form');
                if (missing.has('supposed_father_birth_state'))
                    table.string('supposed_father_birth_state', 2).nullable().after('status_form');
                if (missing.has('supposed_father_birth_city'))
                    table.string('supposed_father_birth_city', 100).nullable().after('status_form');
                if (missing.has('supposed_father_has_residence'))
                    table.boolean('supposed_father_has_residence').notNullable().defaultTo(false).after('status_form');
                if (missing.has('supposed_father_residence_subdistrict'))
                    table.string('supposed_father_residence_subdistrict', 90).nullable().after('status_form');
            });
        });
    }
    async down() {
        this.defer(async (db) => {
            await db.schema.alterTable(this.tableName, (table) => {
                table.dropForeign(['supposed_father_person_id']);
                table.dropColumn('supposed_father_person_id');
                table.dropColumn('supposed_father_enabled');
                table.dropColumn('supposed_father_name_altered');
                table.dropColumn('supposed_father_other_occupation');
                table.dropColumn('supposed_father_birth_state');
                table.dropColumn('supposed_father_birth_city');
                table.dropColumn('supposed_father_has_residence');
            });
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1792713600000_born_certificates_supposed_father.js.map