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
const MarriedCertificate_1 = __importDefault(require("./MarriedCertificate"));
const SecondcopyCertificate_1 = __importDefault(require("./SecondcopyCertificate"));
const Book_1 = __importDefault(require("./Book"));
const Receipt_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Receipt"));
class OrderCertificate extends Orm_1.BaseModel {
}
OrderCertificate.table = 'order_certificates';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], OrderCertificate.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], OrderCertificate.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], OrderCertificate.prototype, "typeCertificate", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], OrderCertificate.prototype, "certificateId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], OrderCertificate.prototype, "bookId", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Company_1.default, { foreignKey: 'companiesId' }),
    __metadata("design:type", Object)
], OrderCertificate.prototype, "company", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => MarriedCertificate_1.default, { foreignKey: 'certificateId' }),
    __metadata("design:type", Object)
], OrderCertificate.prototype, "marriedCertificate", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Book_1.default, { foreignKey: 'bookId' }),
    __metadata("design:type", Object)
], OrderCertificate.prototype, "book", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => SecondcopyCertificate_1.default, { foreignKey: 'certificateId' }),
    __metadata("design:type", Object)
], OrderCertificate.prototype, "secondcopyCertificate", void 0);
__decorate([
    (0, Orm_1.hasOne)(() => Receipt_1.default, { foreignKey: 'orderCertificateId' }),
    __metadata("design:type", Object)
], OrderCertificate.prototype, "receipt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], OrderCertificate.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], OrderCertificate.prototype, "updatedAt", void 0);
exports.default = OrderCertificate;
//# sourceMappingURL=OrderCertificate.js.map