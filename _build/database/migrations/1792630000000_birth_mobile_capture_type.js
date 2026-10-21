"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'birth_mobile_capture_sessions';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('capture_type', 16).notNullable().defaultTo('birth').after('token_hash');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => table.dropColumn('capture_type'));
    }
}
exports.default = default_1;
//# sourceMappingURL=1792630000000_birth_mobile_capture_type.js.map