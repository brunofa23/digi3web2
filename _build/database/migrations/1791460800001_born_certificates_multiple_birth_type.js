"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'born_certificates';
    }
    async up() {
        if (await this.schema.hasColumn(this.tableName, 'multiple_birth_type'))
            return;
        await this.schema.alterTable(this.tableName, (table) => {
            table.string('multiple_birth_type', 20).nullable().after('twins');
        });
    }
    async down() {
        await this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('multiple_birth_type');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1791460800001_born_certificates_multiple_birth_type.js.map