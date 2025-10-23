"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'users';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('usergroup_id').after('companies_id')
                .defaultTo(1).notNullable().unsigned().references('id').inTable('usergroups');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, table => {
            table.dropColumn('usergroup_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1748372177031_users_add_usergroup_ids.js.map