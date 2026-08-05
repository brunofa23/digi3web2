"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'married_certificates';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('RESTRICT');
            table.integer('groom_person_id').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT');
            table.integer('father_groom_person_id').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT');
            table.integer('mother_groom_person_id').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT');
            table.integer('bride_person_id').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT');
            table.integer('fahter_bride_person_id').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT');
            table.integer('mother_bride_person_id').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT');
            table.integer('witness_person_id').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT');
            table.integer('witness2_person_id').unsigned().nullable().references('people.id').onDelete('RESTRICT').onUpdate('RESTRICT');
            table.integer('usr_id').unsigned().nullable().references('users.id').onDelete('RESTRICT').onUpdate('RESTRICT');
            table.integer('status_id').unsigned().nullable().references('statuses.id').onDelete('SET NULL').onUpdate('SET NULL');
            table.dateTime('dthr_schedule');
            table.dateTime('dthr_marriage');
            table.string('type');
            table.text('obs');
            table.string('church_name');
            table.string('church_city');
            table.string('marital_regime');
            table.boolean('prenup').defaultTo(false);
            table.string('registry_office_prenup');
            table.string('addres_registry_office_prenup');
            table.integer('book_registry_office_prenup').unsigned();
            table.integer('sheet_registry_office_prenup').unsigned();
            table.date('dthr_prenup');
            table.string('cerimony_location');
            table.string('other_cerimony_location');
            table.string('name_former_spouse');
            table.date('dthr_divorce_spouse');
            table.string('name_former_spouse2');
            table.date('dthr_divorce_spouse2');
            table.boolean('inactive').defaultTo(false);
            table.string('status_form', 10).notNullable();
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1762782940825_married_certificates.js.map