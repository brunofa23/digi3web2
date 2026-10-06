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
const EmployeeVerificationXCertificate_1 = __importDefault(require("./EmployeeVerificationXCertificate"));
class MandateCertificate extends Orm_1.BaseModel {
}
MandateCertificate.table = 'mandate_certificates';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], MandateCertificate.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'companies_id', serializeAs: 'companiesId' }),
    __metadata("design:type", Number)
], MandateCertificate.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'usr_id', serializeAs: 'usrId' }),
    __metadata("design:type", Object)
], MandateCertificate.prototype, "usrId", void 0);
__decorate([
    Orm_1.column.date({ columnName: 'request_date', serializeAs: 'requestDate' }),
    __metadata("design:type", luxon_1.DateTime)
], MandateCertificate.prototype, "requestDate", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'schedule_date', serializeAs: 'scheduleDate', serialize: (value) => value?.setZone('America/Sao_Paulo').toFormat("yyyy-LL-dd'T'HH:mm") ?? null }),
    __metadata("design:type", Object)
], MandateCertificate.prototype, "scheduleDate", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'mandate_type', serializeAs: 'mandateType' }),
    __metadata("design:type", Number)
], MandateCertificate.prototype, "mandateType", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'rectification_type', serializeAs: 'rectificationType' }),
    __metadata("design:type", Object)
], MandateCertificate.prototype, "rectificationType", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'transcription_type', serializeAs: 'transcriptionType' }),
    __metadata("design:type", Object)
], MandateCertificate.prototype, "transcriptionType", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'has_power_of_attorney', serializeAs: 'hasPowerOfAttorney' }),
    __metadata("design:type", Object)
], MandateCertificate.prototype, "hasPowerOfAttorney", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'applicant_name', serializeAs: 'applicantName' }),
    __metadata("design:type", String)
], MandateCertificate.prototype, "applicantName", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'applicant_cpf', serializeAs: 'applicantCpf' }),
    __metadata("design:type", String)
], MandateCertificate.prototype, "applicantCpf", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'applicant_whatsapp', serializeAs: 'applicantWhatsapp' }),
    __metadata("design:type", String)
], MandateCertificate.prototype, "applicantWhatsapp", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'applicant_phone', serializeAs: 'applicantPhone' }),
    __metadata("design:type", Object)
], MandateCertificate.prototype, "applicantPhone", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'applicant_email', serializeAs: 'applicantEmail' }),
    __metadata("design:type", Object)
], MandateCertificate.prototype, "applicantEmail", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'registered_data', serializeAs: 'registeredData' }),
    __metadata("design:type", Object)
], MandateCertificate.prototype, "registeredData", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'registered_city', serializeAs: 'registeredCity' }),
    __metadata("design:type", Object)
], MandateCertificate.prototype, "registeredCity", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'book_number', serializeAs: 'bookNumber' }),
    __metadata("design:type", Object)
], MandateCertificate.prototype, "bookNumber", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'sheet_number', serializeAs: 'sheetNumber' }),
    __metadata("design:type", Object)
], MandateCertificate.prototype, "sheetNumber", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'term_number', serializeAs: 'termNumber' }),
    __metadata("design:type", Object)
], MandateCertificate.prototype, "termNumber", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], MandateCertificate.prototype, "obs", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'status_form', serializeAs: 'statusForm' }),
    __metadata("design:type", String)
], MandateCertificate.prototype, "statusForm", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], MandateCertificate.prototype, "inactive", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'created_at', serializeAs: 'createdAt', autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], MandateCertificate.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'updated_at', serializeAs: 'updatedAt', autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], MandateCertificate.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.hasMany)(() => EmployeeVerificationXCertificate_1.default, { foreignKey: 'mandateCertificateId' }),
    __metadata("design:type", Object)
], MandateCertificate.prototype, "employeeVerificationXCertificates", void 0);
exports.default = MandateCertificate;
//# sourceMappingURL=MandateCertificate.js.map