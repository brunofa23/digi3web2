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
const Receipt_1 = __importDefault(require("./Receipt"));
const FinPaymentMethod_1 = __importDefault(require("./FinPaymentMethod"));
class ReceiptPayment extends Orm_1.BaseModel {
}
ReceiptPayment.table = 'receipt_payments';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], ReceiptPayment.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], ReceiptPayment.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], ReceiptPayment.prototype, "receiptId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], ReceiptPayment.prototype, "finPaymentmethodId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], ReceiptPayment.prototype, "paymentGroup", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], ReceiptPayment.prototype, "installmentNumber", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], ReceiptPayment.prototype, "installmentCount", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], ReceiptPayment.prototype, "amount", void 0);
__decorate([
    Orm_1.column.date(),
    __metadata("design:type", luxon_1.DateTime)
], ReceiptPayment.prototype, "dueDate", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", Object)
], ReceiptPayment.prototype, "receivedAt", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], ReceiptPayment.prototype, "receivedBy", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", Object)
], ReceiptPayment.prototype, "canceledAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], ReceiptPayment.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], ReceiptPayment.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Receipt_1.default, { foreignKey: 'receiptId' }),
    __metadata("design:type", Object)
], ReceiptPayment.prototype, "receipt", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => FinPaymentMethod_1.default, { foreignKey: 'finPaymentmethodId' }),
    __metadata("design:type", Object)
], ReceiptPayment.prototype, "paymentMethod", void 0);
exports.default = ReceiptPayment;
//# sourceMappingURL=ReceiptPayment.js.map