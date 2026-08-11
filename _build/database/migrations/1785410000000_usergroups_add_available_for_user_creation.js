"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'usergroups';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.boolean('available_for_user_creation').notNullable().defaultTo(false);
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('available_for_user_creation');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1785410000000_usergroups_add_available_for_user_creation.js.map