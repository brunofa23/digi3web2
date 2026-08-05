"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'order_certificates';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('origin', 20).notNullable().defaultTo('internal').after('type_certificate');
            table
                .integer('public_order_certificate_link_id')
                .nullable()
                .unsigned()
                .references('id')
                .inTable('public_order_certificate_links')
                .onUpdate('RESTRICT')
                .onDelete('SET NULL')
                .after('origin');
            table.boolean('lgpd_consent_accepted').notNullable().defaultTo(false).after('public_order_certificate_link_id');
            table.timestamp('lgpd_consent_accepted_at', { useTz: true }).nullable().after('lgpd_consent_accepted');
            table.string('public_request_ip', 45).nullable().after('lgpd_consent_accepted_at');
            table.string('public_request_user_agent', 500).nullable().after('public_request_ip');
            table.index(['origin', 'created_at'], 'idx_order_cert_origin_created');
            table.index('public_order_certificate_link_id', 'idx_order_cert_public_link');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropIndex(['origin', 'created_at'], 'idx_order_cert_origin_created');
            table.dropIndex(['public_order_certificate_link_id'], 'idx_order_cert_public_link');
            table.dropColumn('public_request_user_agent');
            table.dropColumn('public_request_ip');
            table.dropColumn('lgpd_consent_accepted_at');
            table.dropColumn('lgpd_consent_accepted');
            table.dropColumn('public_order_certificate_link_id');
            table.dropColumn('origin');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1783590000001_order_certificates_add_public_audit.js.map