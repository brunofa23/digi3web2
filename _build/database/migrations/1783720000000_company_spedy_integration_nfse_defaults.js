"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class CompanySpedyIntegrationNfseDefaults extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'company_spedy_integrations';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.json('service_invoice_defaults').nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('service_invoice_defaults');
        });
    }
}
exports.default = CompanySpedyIntegrationNfseDefaults;
//# sourceMappingURL=1783720000000_company_spedy_integration_nfse_defaults.js.map