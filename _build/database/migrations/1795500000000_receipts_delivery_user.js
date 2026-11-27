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
        if (await this.schema.hasColumn(this.tableName, 'delivery_user_id'))
            return;
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('delivery_user_id').unsigned().nullable();
        });
    }
    async down() {
        if (!(await this.schema.hasColumn(this.tableName, 'delivery_user_id')))
            return;
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('delivery_user_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1795500000000_receipts_delivery_user.js.map