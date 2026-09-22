"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'fin_images';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('path').after('file_name').nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('path');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1753906996120_fin_images_add_paths.js.map