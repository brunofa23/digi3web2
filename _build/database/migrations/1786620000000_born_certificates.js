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
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table
                .integer('companies_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('companies')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table
                .integer('registered_person_id')
                .unsigned()
                .nullable()
                .references('people.id')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table
                .integer('filiation1_person_id')
                .unsigned()
                .nullable()
                .references('people.id')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table
                .integer('filiation2_person_id')
                .unsigned()
                .nullable()
                .references('people.id')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table
                .integer('declarant_person_id')
                .unsigned()
                .nullable()
                .references('people.id')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table
                .integer('usr_id')
                .unsigned()
                .nullable()
                .references('users.id')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table
                .integer('status_id')
                .unsigned()
                .nullable()
                .references('statuses.id')
                .onUpdate('SET NULL')
                .onDelete('SET NULL');
            table.boolean('registered_name_altered').defaultTo(false);
            table.date('birth_date').nullable();
            table.time('birth_time').nullable();
            table.boolean('birth_time_ignored').defaultTo(false);
            table.boolean('twins').defaultTo(false);
            table.string('dnv_number', 30).nullable();
            table.boolean('dnv_not_found').defaultTo(false);
            table.string('dnv_missing_reason', 120).nullable();
            table.string('naturalness_state', 2).nullable();
            table.string('naturalness_city', 100).nullable();
            table.string('occurrence_location_type', 50).nullable();
            table.string('occurrence_place', 150).nullable();
            table.string('occurrence_zip_code', 15).nullable();
            table.string('occurrence_address', 150).nullable();
            table.string('occurrence_street_number', 10).nullable();
            table.string('occurrence_district', 100).nullable();
            table.string('occurrence_country', 50).nullable();
            table.string('occurrence_state', 2).nullable();
            table.string('occurrence_city', 100).nullable();
            table.string('occurrence_subdistrict', 100).nullable();
            table.boolean('filiation1_considered_mother').defaultTo(false);
            table.boolean('filiation1_name_altered').defaultTo(false);
            table.boolean('filiation1_other_occupation').defaultTo(false);
            table.string('filiation1_birth_state', 2).nullable();
            table.string('filiation1_birth_city', 100).nullable();
            table.string('filiation1_birth_place', 150).nullable();
            table.string('filiation1_residence_country', 50).nullable();
            table.string('filiation1_residence_subdistrict', 100).nullable();
            table.boolean('filiation2_considered_mother').defaultTo(false);
            table.boolean('filiation2_name_altered').defaultTo(false);
            table.boolean('filiation2_other_occupation').defaultTo(false);
            table.string('filiation2_birth_state', 2).nullable();
            table.string('filiation2_birth_city', 100).nullable();
            table.string('filiation2_birth_place', 150).nullable();
            table.string('filiation2_residence_country', 50).nullable();
            table.string('filiation2_residence_subdistrict', 100).nullable();
            table.string('grandfather_filiation1', 90).nullable();
            table.string('grandmother_filiation1', 90).nullable();
            table.string('grandfather_filiation2', 90).nullable();
            table.string('grandmother_filiation2', 90).nullable();
            table.string('declarant_type', 50).nullable();
            table.boolean('declarant_other_occupation').defaultTo(false);
            table.string('declarant_birth_state', 2).nullable();
            table.string('declarant_birth_city', 100).nullable();
            table.string('declarant_residence_country', 50).nullable();
            table.string('declarant_residence_subdistrict', 100).nullable();
            table.string('electronic_address', 120).nullable();
            table.string('phone', 20).nullable();
            table.text('obs').nullable();
            table.boolean('inactive').defaultTo(false);
            table.string('status_form', 10).notNullable().defaultTo('draft');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.index(['companies_id', 'registered_person_id'], 'idx_born_cert_comp_registered');
            table.index(['companies_id', 'birth_date'], 'idx_born_cert_comp_birth_date');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1786620000000_born_certificates.js.map