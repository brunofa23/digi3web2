"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'people';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('companies_id').notNullable().unsigned().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('RESTRICT');
            table.string('name', 90).notNullable();
            table.string('name_married', 90);
            table.string('cpf', 11).index();
            table.string('gender', 1);
            table.boolean('deceased').defaultTo(false);
            table.date('date_birth');
            table.string('marital_status', 15);
            table.boolean('illiterate').defaultTo(false);
            table.string('place_birth', 100);
            table.string('nationality', 50);
            table.integer('occupation_id').nullable().unsigned().references('id').inTable('occupations').onDelete('SET NULL');
            table.string('zip_code', 15);
            table.string('address', 150);
            table.string('street_number', 5);
            table.string('street_complement', 10);
            table.string('district', 100);
            table.string('city', 100);
            table.string('state', 2);
            table.string('document_type', 50);
            table.string('document_number', 50).index();
            table.string('phone', 15);
            table.string('cellphone', 15);
            table.string('email', 90).index();
            table.boolean('inactive').defaultTo('false');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1762782851471_people.js.map