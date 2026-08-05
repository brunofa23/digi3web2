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
        this.schema.alterTable(this.tableName, (table) => {
            table.dateTime('date_married_real').nullable().after('dthr_schedule');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('date_married_real');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1785400000000_married_certificates_add_date_married_real.js.map