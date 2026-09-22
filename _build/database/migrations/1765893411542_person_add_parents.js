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
        this.schema.alterTable(this.tableName, (table) => {
            table.string('mother', 100).notNullable().after('nationality');
            table.string('father', 100).notNullable().after('nationality');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('mother');
            table.dropColumn('father');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1765893411542_person_add_parents.js.map