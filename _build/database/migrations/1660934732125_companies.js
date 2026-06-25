"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'companies';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.string('name', 120).notNullable();
            table.string('shortname', 45).notNullable().unique();
            table.string('foldername', 45).notNullable().unique().defaultTo("1");
            table.string('address', 70);
            table.string('number');
            table.string('complement', 45);
            table.string('postalcode', 8);
            table.string('district', 70);
            table.string('city', 45);
            table.string('state', 2);
            table.string('cnpj');
            table.string('responsablename');
            table.string('phoneresponsable');
            table.string('email');
            table.boolean('status');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1660934732125_companies.js.map