"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'typebook_settings';
    }
    async up() {
        await this.schema.raw(`
      CREATE TABLE IF NOT EXISTS typebook_settings (
        typebooks_id INT UNSIGNED NOT NULL,
        disable_portrait BOOLEAN NOT NULL DEFAULT FALSE,
        PRIMARY KEY (typebooks_id)
      ) ENGINE=InnoDB
    `);
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1795000000000_typebooks_disable_portrait.js.map