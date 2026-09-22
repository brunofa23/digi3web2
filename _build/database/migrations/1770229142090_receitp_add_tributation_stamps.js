"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'receipts';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('stamps', 255).after('date_stamp').nullable;
            table.integer('tributation_id').nullable().unsigned().references('id').inTable('tributations')
                .onUpdate('RESTRICT').onDelete('RESTRICT').after('user_id');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('stamps');
            table.dropColumn('tributation_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1770229142090_receitp_add_tributation_stamps.js.map