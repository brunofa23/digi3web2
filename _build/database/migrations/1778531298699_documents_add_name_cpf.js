"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'indeximages';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('name').nullable().after('previous_file_name');
            table.string('cpf').nullable().after('name');
            table.integer('book').nullable().after('cpf');
            table.integer('sheet').nullable().after('book');
            table.integer('register', 20).nullable().after('sheet');
            table.text('index_text').nullable().after('cpf');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('cpf');
            table.dropColumn('name');
            table.dropColumn('book');
            table.dropColumn('sheet');
            table.dropColumn('register');
            table.dropColumn('index_text');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1778531298699_documents_add_name_cpf.js.map