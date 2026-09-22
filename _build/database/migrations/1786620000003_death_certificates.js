"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'death_certificates';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('companies_id').unsigned().notNullable()
                .references('id').inTable('companies')
                .onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('deceased_person_id').unsigned().nullable()
                .references('id').inTable('people')
                .onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('filiation1_person_id').unsigned().nullable()
                .references('id').inTable('people')
                .onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('filiation2_person_id').unsigned().nullable()
                .references('id').inTable('people')
                .onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('declarant_person_id').unsigned().nullable()
                .references('id').inTable('people')
                .onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('usr_id').unsigned().nullable()
                .references('id').inTable('users')
                .onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('status_id').unsigned().nullable()
                .references('id').inTable('statuses')
                .onUpdate('SET NULL').onDelete('SET NULL');
            table.string('death_declaration_number', 30).nullable();
            table.boolean('death_declaration_not_found').defaultTo(false);
            table.boolean('deceased_unknown').defaultTo(false);
            table.string('naturalness_state', 2).nullable();
            table.string('naturalness_city', 100).nullable();
            table.date('birth_date').nullable();
            table.date('death_date').nullable();
            table.boolean('death_date_unknown').defaultTo(false);
            table.time('death_time').nullable();
            table.boolean('death_time_unknown').defaultTo(false);
            table.integer('age').unsigned().nullable();
            table.string('age_type', 15).nullable();
            table.boolean('stable_union').defaultTo(false);
            table.string('marital_status', 30).nullable();
            table.string('race', 30).nullable();
            table.boolean('other_occupation').defaultTo(false);
            table.string('former_spouse_name', 90).nullable();
            table.integer('former_spouse_book_number').unsigned().nullable();
            table.integer('former_spouse_sheet_number').unsigned().nullable();
            table.string('former_spouse_term_number', 30).nullable();
            table.string('former_spouse_registry_office', 150).nullable();
            table.boolean('occurrence_found_alive').defaultTo(false);
            table.string('occurrence_location_type', 50).nullable();
            table.string('occurrence_zip_code', 15).nullable();
            table.string('occurrence_address', 150).nullable();
            table.string('occurrence_street_number', 20).nullable();
            table.string('occurrence_district', 100).nullable();
            table.string('occurrence_country', 50).nullable();
            table.string('occurrence_state', 2).nullable();
            table.string('occurrence_city', 100).nullable();
            table.string('occurrence_subdistrict', 100).nullable();
            table.string('burial_status', 30).nullable();
            table.boolean('cremation_manifestation').defaultTo(false);
            table.string('burial_witnesses', 255).nullable();
            table.string('burial_state', 2).nullable();
            table.string('burial_city', 100).nullable();
            table.boolean('will_be_cremated').defaultTo(false);
            table.string('burial_place', 150).nullable();
            table.string('burial_doctor', 100).nullable();
            table.string('burial_doctor_crm', 30).nullable();
            table.string('burial_observation', 255).nullable();
            table.boolean('filiation1_naturalness_ignored').defaultTo(false);
            table.string('filiation1_birth_state', 2).nullable();
            table.string('filiation1_birth_city', 100).nullable();
            table.boolean('filiation1_other_occupation').defaultTo(false);
            table.boolean('filiation2_naturalness_ignored').defaultTo(false);
            table.string('filiation2_birth_state', 2).nullable();
            table.string('filiation2_birth_city', 100).nullable();
            table.boolean('filiation2_other_occupation').defaultTo(false);
            table.string('declarant_type', 50).nullable();
            table.boolean('declarant_other_occupation').defaultTo(false);
            table.string('declarant_birth_state', 2).nullable();
            table.string('declarant_birth_city', 100).nullable();
            table.string('electronic_address', 120).nullable();
            table.string('phone', 20).nullable();
            table.text('obs').nullable();
            table.boolean('inactive').defaultTo(false);
            table.string('status_form', 10).notNullable().defaultTo('draft');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.index(['companies_id', 'deceased_person_id'], 'idx_death_cert_comp_deceased');
            table.index(['companies_id', 'death_date'], 'idx_death_cert_comp_death_date');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1786620000003_death_certificates.js.map