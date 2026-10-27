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
            table.boolean('was_voter').nullable().after('death_children');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('was_voter');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1793000000003_death_certificates_was_voter.js.map