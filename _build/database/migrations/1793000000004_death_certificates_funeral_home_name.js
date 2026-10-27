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
        this.schema.alterTable(this.tableName, (table) => {
            table.string('funeral_home_name', 150).nullable().after('burial_doctor');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('funeral_home_name');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1793000000004_death_certificates_funeral_home_name.js.map