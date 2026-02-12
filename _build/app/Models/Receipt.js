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
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const OrderCertificate_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/OrderCertificate"));
const Service_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Service"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
const ReceiptItem_1 = __importDefault(require("./ReceiptItem"));
const EmployeeVerificationXReceipt_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/EmployeeVerificationXReceipt"));
const Tributation_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Tributation"));
class Receipt extends Orm_1.BaseModel {
}
Receipt.table = 'receipts';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Receipt.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Receipt.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Receipt.prototype, "orderCertificateId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Receipt.prototype, "serviceId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Receipt.prototype, "userId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Receipt.prototype, "tributationId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Receipt.prototype, "free", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Receipt.prototype, "applicant", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Receipt.prototype, "cpfApplicant", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Receipt.prototype, "registered1", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Receipt.prototype, "cpfRegistered1", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Receipt.prototype, "registered2", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Receipt.prototype, "cpfRegistered2", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Receipt.prototype, "typebookId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Receipt.prototype, "book", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Receipt.prototype, "sheet", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Receipt.prototype, "side", void 0);
__decorate([
    Orm_1.column.date(),
    __metadata("design:type", Object)
], Receipt.prototype, "datePrevision", void 0);
__decorate([
    Orm_1.column.date(),
    __metadata("design:type", Object)
], Receipt.prototype, "dateProtocol", void 0);
__decorate([
    Orm_1.column.date(),
    __metadata("design:type", Object)
], Receipt.prototype, "dateStamp", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", Object)
], Receipt.prototype, "dateMarriage", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Receipt.prototype, "stamps", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Receipt.prototype, "securitySheet", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Receipt.prototype, "habilitationProccess", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Receipt.prototype, "status", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Receipt.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Receipt.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Company_1.default, { foreignKey: 'companiesId' }),
    __metadata("design:type", Object)
], Receipt.prototype, "company", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => OrderCertificate_1.default, { foreignKey: 'orderCertificateId' }),
    __metadata("design:type", Object)
], Receipt.prototype, "orderCertificate", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Service_1.default, { foreignKey: 'serviceId' }),
    __metadata("design:type", Object)
], Receipt.prototype, "service", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => User_1.default, { foreignKey: 'userId' }),
    __metadata("design:type", Object)
], Receipt.prototype, "user", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Typebook_1.default, { foreignKey: 'typebookId' }),
    __metadata("design:type", Object)
], Receipt.prototype, "typebook", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Tributation_1.default, { foreignKey: 'tributationId' }),
    __metadata("design:type", Object)
], Receipt.prototype, "tributation", void 0);
__decorate([
    (0, Orm_1.hasMany)(() => ReceiptItem_1.default, { foreignKey: 'receiptId' }),
    __metadata("design:type", Object)
], Receipt.prototype, "items", void 0);
__decorate([
    (0, Orm_1.hasMany)(() => EmployeeVerificationXReceipt_1.default, { foreignKey: 'receiptId' }),
    __metadata("design:type", Object)
], Receipt.prototype, "employeeVerificationXReceipts", void 0);
exports.default = Receipt;
//# sourceMappingURL=Receipt.js.map