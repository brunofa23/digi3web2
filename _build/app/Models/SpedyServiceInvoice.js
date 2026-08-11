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
const Orm_1 = global[Symbol.for('ioc.use')]("Adonis/Lucid/Orm");
const Company_1 = __importDefault(require("./Company"));
const Receipt_1 = __importDefault(require("./Receipt"));
function parseJson(value) {
    if (!value)
        return null;
    if (typeof value === 'string')
        return JSON.parse(value);
    return value;
}
class SpedyServiceInvoice extends Orm_1.BaseModel {
}
SpedyServiceInvoice.table = 'spedy_service_invoices';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], SpedyServiceInvoice.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], SpedyServiceInvoice.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SpedyServiceInvoice.prototype, "receiptId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], SpedyServiceInvoice.prototype, "environment", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SpedyServiceInvoice.prototype, "spedyCompanyId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SpedyServiceInvoice.prototype, "spedyInvoiceId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], SpedyServiceInvoice.prototype, "integrationId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SpedyServiceInvoice.prototype, "status", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SpedyServiceInvoice.prototype, "number", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], SpedyServiceInvoice.prototype, "amount", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SpedyServiceInvoice.prototype, "receiverName", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SpedyServiceInvoice.prototype, "receiverFederalTaxNumber", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SpedyServiceInvoice.prototype, "description", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", Object)
], SpedyServiceInvoice.prototype, "effectiveDate", void 0);
__decorate([
    (0, Orm_1.column)({
        prepare: (value) => value === undefined ? null : JSON.stringify(value),
        consume: parseJson,
    }),
    __metadata("design:type", Object)
], SpedyServiceInvoice.prototype, "requestPayload", void 0);
__decorate([
    (0, Orm_1.column)({
        prepare: (value) => value === undefined ? null : JSON.stringify(value),
        consume: parseJson,
    }),
    __metadata("design:type", Object)
], SpedyServiceInvoice.prototype, "responsePayload", void 0);
__decorate([
    (0, Orm_1.column)({
        prepare: (value) => value === undefined ? null : JSON.stringify(value),
        consume: parseJson,
    }),
    __metadata("design:type", Object)
], SpedyServiceInvoice.prototype, "processingDetail", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], SpedyServiceInvoice.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], SpedyServiceInvoice.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Company_1.default, { foreignKey: 'companiesId' }),
    __metadata("design:type", Object)
], SpedyServiceInvoice.prototype, "company", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Receipt_1.default, { foreignKey: 'receiptId' }),
    __metadata("design:type", Object)
], SpedyServiceInvoice.prototype, "receipt", void 0);
exports.default = SpedyServiceInvoice;
//# sourceMappingURL=SpedyServiceInvoice.js.map