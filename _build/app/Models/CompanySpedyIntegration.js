"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const Encryption_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Encryption"));
const Orm_1 = global[Symbol.for('ioc.use')]("Adonis/Lucid/Orm");
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
const Company_1 = __importDefault(require("./Company"));
function parseJson(value) {
    if (!value)
        return null;
    if (typeof value === 'string')
        return JSON.parse(value);
    return value;
}
class CompanySpedyIntegration extends Orm_1.BaseModel {
    static async encryptApiKey(integration) {
        if (integration.$dirty.spedyApiKey && integration.spedyApiKey) {
            integration.spedyApiKey = await Encryption_1.default.encrypt(integration.spedyApiKey);
        }
    }
    static decryptApiKey(integration) {
        if (!Helpers_1.types.isNull(integration.spedyApiKey) && integration.spedyApiKey) {
            integration.spedyApiKey = Encryption_1.default.decrypt(integration.spedyApiKey);
        }
    }
    static decryptApiKeys(integrations) {
        integrations.forEach((integration) => this.decryptApiKey(integration));
    }
}
CompanySpedyIntegration.table = 'company_spedy_integrations';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], CompanySpedyIntegration.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], CompanySpedyIntegration.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], CompanySpedyIntegration.prototype, "environment", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], CompanySpedyIntegration.prototype, "spedyCompanyId", void 0);
__decorate([
    (0, Orm_1.column)({ serializeAs: null }),
    __metadata("design:type", Object)
], CompanySpedyIntegration.prototype, "spedyApiKey", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], CompanySpedyIntegration.prototype, "isOwner", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], CompanySpedyIntegration.prototype, "active", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", Object)
], CompanySpedyIntegration.prototype, "lastSyncAt", void 0);
__decorate([
    (0, Orm_1.column)({
        prepare: (value) => value === undefined ? null : JSON.stringify(value),
        consume: parseJson,
    }),
    __metadata("design:type", Object)
], CompanySpedyIntegration.prototype, "lastCompanySnapshot", void 0);
__decorate([
    (0, Orm_1.column)({
        prepare: (value) => value === undefined ? null : JSON.stringify(value),
        consume: parseJson,
    }),
    __metadata("design:type", Object)
], CompanySpedyIntegration.prototype, "serviceInvoiceDefaults", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Company_1.default, {
        foreignKey: 'companiesId',
    }),
    __metadata("design:type", Object)
], CompanySpedyIntegration.prototype, "company", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], CompanySpedyIntegration.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], CompanySpedyIntegration.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.beforeSave)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CompanySpedyIntegration]),
    __metadata("design:returntype", Promise)
], CompanySpedyIntegration, "encryptApiKey", null);
__decorate([
    (0, Orm_1.afterFind)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CompanySpedyIntegration]),
    __metadata("design:returntype", void 0)
], CompanySpedyIntegration, "decryptApiKey", null);
__decorate([
    (0, Orm_1.afterFetch)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], CompanySpedyIntegration, "decryptApiKeys", null);
exports.default = CompanySpedyIntegration;
//# sourceMappingURL=CompanySpedyIntegration.js.map