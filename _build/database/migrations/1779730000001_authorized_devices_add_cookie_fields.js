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
        this.schema.alterTable(this.tableName, (table) => {
            table.string('device_cookie_hash', 128).nullable().index();
            table.timestamp('device_cookie_created_at').nullable();
            table.timestamp('device_cookie_last_seen_at').nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('device_cookie_hash');
            table.dropColumn('device_cookie_created_at');
            table.dropColumn('device_cookie_last_seen_at');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1779730000001_authorized_devices_add_cookie_fields.js.map