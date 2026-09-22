"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class EmolumentService extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'emolument_service';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table
                .integer('companies_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('companies')
                .onUpdate('RESTRICT')
                .onDelete('RESTRICT');
            table
                .integer('service_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('services')
                .onUpdate('RESTRICT')
                .onDelete('CASCADE');
            table
                .integer('emolument_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('emoluments')
                .onUpdate('RESTRICT')
                .onDelete('CASCADE');
            table.unique(['companies_id', 'service_id', 'emolument_id']);
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = EmolumentService;
//# sourceMappingURL=1765997306937_emolument_services.js.map