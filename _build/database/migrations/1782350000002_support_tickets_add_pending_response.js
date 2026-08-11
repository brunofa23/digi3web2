"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'support_tickets';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('pending_response_from', 30).nullable().after('status');
            table.string('last_interaction_by', 30).nullable().after('pending_response_from');
            table.timestamp('last_interaction_at', { useTz: true }).nullable().after('last_interaction_by');
            table.index(['companies_id', 'pending_response_from'], 'support_tickets_company_pending_idx');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropIndex(['companies_id', 'pending_response_from'], 'support_tickets_company_pending_idx');
            table.dropColumn('pending_response_from');
            table.dropColumn('last_interaction_by');
            table.dropColumn('last_interaction_at');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1782350000002_support_tickets_add_pending_response.js.map