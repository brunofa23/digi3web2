"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'authorized_devices';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('company_id').notNullable().index();
            table.integer('user_id').nullable().index();
            table.string('device_name', 150).notNullable();
            table.string('device_identifier', 255).notNullable().index();
            table.boolean('active').defaultTo(true);
            table.timestamp('last_used_at').nullable();
            table.timestamp('revoked_at').nullable();
            table.timestamps(true);
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1775499587554_authorized_devices.js.map