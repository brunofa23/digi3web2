"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'indeximage_side_models';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dateTime('archived_at').nullable().after('finished_at');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('archived_at');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1794400000000_indeximage_side_models_archived_at.js.map