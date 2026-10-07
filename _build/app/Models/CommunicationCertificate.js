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
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const Orm_1 = global[Symbol.for('ioc.use')]("Adonis/Lucid/Orm");
class CommunicationCertificate extends Orm_1.BaseModel {
}
CommunicationCertificate.table = 'communication_certificates';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], CommunicationCertificate.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'companies_id', serializeAs: 'companiesId' }),
    __metadata("design:type", Number)
], CommunicationCertificate.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'usr_id', serializeAs: 'usrId' }),
    __metadata("design:type", Object)
], CommunicationCertificate.prototype, "usrId", void 0);
__decorate([
    Orm_1.column.date({ columnName: 'registration_date', serializeAs: 'registrationDate' }),
    __metadata("design:type", luxon_1.DateTime)
], CommunicationCertificate.prototype, "registrationDate", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'registered_name', serializeAs: 'registeredName' }),
    __metadata("design:type", String)
], CommunicationCertificate.prototype, "registeredName", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'service_type', serializeAs: 'serviceType' }),
    __metadata("design:type", Number)
], CommunicationCertificate.prototype, "serviceType", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'delivery_type', serializeAs: 'deliveryType' }),
    __metadata("design:type", Number)
], CommunicationCertificate.prototype, "deliveryType", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'communication_type', serializeAs: 'communicationType' }),
    __metadata("design:type", Number)
], CommunicationCertificate.prototype, "communicationType", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'origin_office', serializeAs: 'originOffice' }),
    __metadata("design:type", String)
], CommunicationCertificate.prototype, "originOffice", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'origin_obs', serializeAs: 'originObs' }),
    __metadata("design:type", Object)
], CommunicationCertificate.prototype, "originObs", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'destination_office', serializeAs: 'destinationOffice' }),
    __metadata("design:type", String)
], CommunicationCertificate.prototype, "destinationOffice", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'destination_obs', serializeAs: 'destinationObs' }),
    __metadata("design:type", Object)
], CommunicationCertificate.prototype, "destinationObs", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'created_at', serializeAs: 'createdAt', autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], CommunicationCertificate.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'updated_at', serializeAs: 'updatedAt', autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], CommunicationCertificate.prototype, "updatedAt", void 0);
exports.default = CommunicationCertificate;
//# sourceMappingURL=CommunicationCertificate.js.map