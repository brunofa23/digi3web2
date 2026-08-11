"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'webauthn_credentials';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('authorized_device_id').notNullable().index();
            table.integer('company_id').notNullable().index();
            table.integer('user_id').nullable().index();
            table.string('credential_id', 512).notNullable().unique();
            table.text('public_key').notNullable();
            table.integer('counter').notNullable().defaultTo(0);
            table.string('transports', 255).nullable();
            table.string('device_type', 50).nullable();
            table.boolean('backed_up').defaultTo(false);
            table.timestamps(true);
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1779720000000_webauthn_credentials.js.map