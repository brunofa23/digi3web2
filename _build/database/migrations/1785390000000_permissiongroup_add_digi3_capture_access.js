"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'permissiongroups';
        this.permissionId = 41;
    }
    async up() {
        const hasInactive = await this.schema.hasColumn(this.tableName, 'inactive');
        const statusColumn = hasInactive ? 'inactive' : 'status';
        const statusValue = hasInactive ? 'false' : 'true';
        await this.schema.raw(`
      INSERT INTO ${this.tableName} (id, name, \`desc\`, ${statusColumn}, created_at, updated_at)
      VALUES (${this.permissionId}, 'Acesso app android', 'Permite acesso ao app Android digi3Capture.', ${statusValue}, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        \`desc\` = VALUES(\`desc\`),
        ${statusColumn} = VALUES(${statusColumn}),
        updated_at = NOW()
    `);
    }
    async down() {
        await this.schema.raw(`DELETE FROM ${this.tableName} WHERE id = ${this.permissionId}`);
    }
}
exports.default = default_1;
//# sourceMappingURL=1785390000000_permissiongroup_add_digi3_capture_access.js.map