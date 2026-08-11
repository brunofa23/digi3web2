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
const MarriedCertificate_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/MarriedCertificate"));
const EmployeeVerification_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/EmployeeVerification"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
class EmployeeVerificationXCertificate extends Orm_1.BaseModel {
}
EmployeeVerificationXCertificate.table = 'employee_verification_x_certificates';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], EmployeeVerificationXCertificate.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'married_certificate_id' }),
    __metadata("design:type", Number)
], EmployeeVerificationXCertificate.prototype, "marriedCertificateId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'companies_id' }),
    __metadata("design:type", Number)
], EmployeeVerificationXCertificate.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'employee_verification_id' }),
    __metadata("design:type", Number)
], EmployeeVerificationXCertificate.prototype, "employeeVerificationId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'user_id' }),
    __metadata("design:type", Number)
], EmployeeVerificationXCertificate.prototype, "userId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], EmployeeVerificationXCertificate.prototype, "status", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", luxon_1.DateTime)
], EmployeeVerificationXCertificate.prototype, "date", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], EmployeeVerificationXCertificate.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], EmployeeVerificationXCertificate.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => MarriedCertificate_1.default, {
        foreignKey: 'marriedCertificateId',
    }),
    __metadata("design:type", Object)
], EmployeeVerificationXCertificate.prototype, "marriedCertificate", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => EmployeeVerification_1.default, {
        foreignKey: 'employeeVerificationId',
    }),
    __metadata("design:type", Object)
], EmployeeVerificationXCertificate.prototype, "employeeVerification", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Company_1.default, {
        foreignKey: 'companiesId',
    }),
    __metadata("design:type", Object)
], EmployeeVerificationXCertificate.prototype, "company", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => User_1.default, {
        foreignKey: 'userId',
    }),
    __metadata("design:type", Object)
], EmployeeVerificationXCertificate.prototype, "user", void 0);
exports.default = EmployeeVerificationXCertificate;
//# sourceMappingURL=EmployeeVerificationXCertificate.js.map