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
        await this.schema.alterTable(this.tableName, (table) => {
            table.integer('book').nullable().after('previous_file_name');
            table.integer('sheet').nullable().after('book');
            table.integer('register', 20).nullable().after('sheet');
        });
    }
    async down() {
        await this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('book');
            table.dropColumn('sheet');
            table.dropColumn('register');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1778531298699_documents_add_name_cpf.js.map