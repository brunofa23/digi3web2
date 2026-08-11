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
            table.date('date_death').nullable().after('date_birth');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('date_death');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1785440000000_people_add_date_death.js.map