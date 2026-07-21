"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'secondcopy_certificates';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('obs', 255).nullable().after('applicant');
            table.boolean('inactive').defaultTo(false).after('city2');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('obs');
            table.dropColumn('inactive');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1765894271884_secondcopy_certificates_add_obs_inactives.js.map