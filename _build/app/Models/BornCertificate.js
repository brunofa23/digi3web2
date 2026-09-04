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
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const Status_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Status"));
const Person_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Person"));
class BornCertificate extends Orm_1.BaseModel {
}
BornCertificate.table = 'born_certificates';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], BornCertificate.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'companies_id', serializeAs: 'companiesId' }),
    __metadata("design:type", Number)
], BornCertificate.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'registered_person_id', serializeAs: 'registeredPersonId' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "registeredPersonId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation1_person_id', serializeAs: 'filiation1PersonId' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "filiation1PersonId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation2_person_id', serializeAs: 'filiation2PersonId' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "filiation2PersonId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'declarant_person_id', serializeAs: 'declarantPersonId' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "declarantPersonId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'usr_id', serializeAs: 'usrId' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "usrId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'status_id', serializeAs: 'statusId' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "statusId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'registered_name_altered', serializeAs: 'registeredNameAltered' }),
    __metadata("design:type", Boolean)
], BornCertificate.prototype, "registeredNameAltered", void 0);
__decorate([
    Orm_1.column.date({ columnName: 'birth_date', serializeAs: 'birthDate' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "birthDate", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'birth_time', serializeAs: 'birthTime' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "birthTime", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'birth_time_ignored', serializeAs: 'birthTimeIgnored' }),
    __metadata("design:type", Boolean)
], BornCertificate.prototype, "birthTimeIgnored", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], BornCertificate.prototype, "twins", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'dnv_number', serializeAs: 'dnvNumber' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "dnvNumber", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'dnv_not_found', serializeAs: 'dnvNotFound' }),
    __metadata("design:type", Boolean)
], BornCertificate.prototype, "dnvNotFound", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'dnv_missing_reason', serializeAs: 'dnvMissingReason' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "dnvMissingReason", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'naturalness_state', serializeAs: 'naturalnessState' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "naturalnessState", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'naturalness_city', serializeAs: 'naturalnessCity' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "naturalnessCity", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_location_type', serializeAs: 'occurrenceLocationType' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "occurrenceLocationType", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_place', serializeAs: 'occurrencePlace' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "occurrencePlace", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_zip_code', serializeAs: 'occurrenceZipCode' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "occurrenceZipCode", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_address', serializeAs: 'occurrenceAddress' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "occurrenceAddress", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_street_number', serializeAs: 'occurrenceStreetNumber' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "occurrenceStreetNumber", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_district', serializeAs: 'occurrenceDistrict' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "occurrenceDistrict", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_country', serializeAs: 'occurrenceCountry' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "occurrenceCountry", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_state', serializeAs: 'occurrenceState' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "occurrenceState", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_city', serializeAs: 'occurrenceCity' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "occurrenceCity", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_subdistrict', serializeAs: 'occurrenceSubdistrict' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "occurrenceSubdistrict", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation1_considered_mother', serializeAs: 'filiation1ConsideredMother' }),
    __metadata("design:type", Boolean)
], BornCertificate.prototype, "filiation1ConsideredMother", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation1_name_altered', serializeAs: 'filiation1NameAltered' }),
    __metadata("design:type", Boolean)
], BornCertificate.prototype, "filiation1NameAltered", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation1_other_occupation', serializeAs: 'filiation1OtherOccupation' }),
    __metadata("design:type", Boolean)
], BornCertificate.prototype, "filiation1OtherOccupation", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation1_birth_state', serializeAs: 'filiation1BirthState' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "filiation1BirthState", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation1_birth_city', serializeAs: 'filiation1BirthCity' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "filiation1BirthCity", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation1_birth_place', serializeAs: 'filiation1BirthPlace' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "filiation1BirthPlace", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation1_residence_country', serializeAs: 'filiation1ResidenceCountry' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "filiation1ResidenceCountry", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation1_residence_subdistrict', serializeAs: 'filiation1ResidenceSubdistrict' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "filiation1ResidenceSubdistrict", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation2_considered_mother', serializeAs: 'filiation2ConsideredMother' }),
    __metadata("design:type", Boolean)
], BornCertificate.prototype, "filiation2ConsideredMother", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation2_name_altered', serializeAs: 'filiation2NameAltered' }),
    __metadata("design:type", Boolean)
], BornCertificate.prototype, "filiation2NameAltered", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation2_other_occupation', serializeAs: 'filiation2OtherOccupation' }),
    __metadata("design:type", Boolean)
], BornCertificate.prototype, "filiation2OtherOccupation", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation2_birth_state', serializeAs: 'filiation2BirthState' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "filiation2BirthState", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation2_birth_city', serializeAs: 'filiation2BirthCity' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "filiation2BirthCity", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation2_birth_place', serializeAs: 'filiation2BirthPlace' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "filiation2BirthPlace", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation2_residence_country', serializeAs: 'filiation2ResidenceCountry' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "filiation2ResidenceCountry", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation2_residence_subdistrict', serializeAs: 'filiation2ResidenceSubdistrict' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "filiation2ResidenceSubdistrict", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'grandfather_filiation1', serializeAs: 'grandfatherFiliation1' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "grandfatherFiliation1", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'grandmother_filiation1', serializeAs: 'grandmotherFiliation1' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "grandmotherFiliation1", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'grandfather_filiation2', serializeAs: 'grandfatherFiliation2' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "grandfatherFiliation2", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'grandmother_filiation2', serializeAs: 'grandmotherFiliation2' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "grandmotherFiliation2", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'declarant_type', serializeAs: 'declarantType' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "declarantType", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'declarant_other_occupation', serializeAs: 'declarantOtherOccupation' }),
    __metadata("design:type", Boolean)
], BornCertificate.prototype, "declarantOtherOccupation", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'declarant_birth_state', serializeAs: 'declarantBirthState' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "declarantBirthState", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'declarant_birth_city', serializeAs: 'declarantBirthCity' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "declarantBirthCity", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'declarant_residence_country', serializeAs: 'declarantResidenceCountry' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "declarantResidenceCountry", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'declarant_residence_subdistrict', serializeAs: 'declarantResidenceSubdistrict' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "declarantResidenceSubdistrict", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'electronic_address', serializeAs: 'electronicAddress' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "electronicAddress", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], BornCertificate.prototype, "phone", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], BornCertificate.prototype, "obs", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], BornCertificate.prototype, "inactive", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'status_form', serializeAs: 'statusForm' }),
    __metadata("design:type", String)
], BornCertificate.prototype, "statusForm", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Company_1.default, { foreignKey: 'companiesId' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "company", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => User_1.default, { foreignKey: 'usrId' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "user", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Status_1.default, { foreignKey: 'statusId' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "status", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'registeredPersonId' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "registered", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'filiation1PersonId' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "filiation1", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'filiation2PersonId' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "filiation2", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'declarantPersonId' }),
    __metadata("design:type", Object)
], BornCertificate.prototype, "declarant", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'created_at', serializeAs: 'createdAt', autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], BornCertificate.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({
        columnName: 'updated_at',
        serializeAs: 'updatedAt',
        autoCreate: true,
        autoUpdate: true,
    }),
    __metadata("design:type", luxon_1.DateTime)
], BornCertificate.prototype, "updatedAt", void 0);
exports.default = BornCertificate;
//# sourceMappingURL=BornCertificate.js.map