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
const EmployeeVerificationXCertificate_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/EmployeeVerificationXCertificate"));
class DeathCertificate extends Orm_1.BaseModel {
}
DeathCertificate.table = 'death_certificates';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], DeathCertificate.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'companies_id', serializeAs: 'companiesId' }),
    __metadata("design:type", Number)
], DeathCertificate.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'deceased_person_id', serializeAs: 'deceasedPersonId' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "deceasedPersonId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation1_person_id', serializeAs: 'filiation1PersonId' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "filiation1PersonId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation2_person_id', serializeAs: 'filiation2PersonId' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "filiation2PersonId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'declarant_person_id', serializeAs: 'declarantPersonId' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "declarantPersonId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'usr_id', serializeAs: 'usrId' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "usrId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'status_id', serializeAs: 'statusId' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "statusId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'death_declaration_number', serializeAs: 'deathDeclarationNumber' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "deathDeclarationNumber", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'death_declaration_not_found', serializeAs: 'deathDeclarationNotFound' }),
    __metadata("design:type", Boolean)
], DeathCertificate.prototype, "deathDeclarationNotFound", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'deceased_unknown', serializeAs: 'deceasedUnknown' }),
    __metadata("design:type", Boolean)
], DeathCertificate.prototype, "deceasedUnknown", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'naturalness_state', serializeAs: 'naturalnessState' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "naturalnessState", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'naturalness_city', serializeAs: 'naturalnessCity' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "naturalnessCity", void 0);
__decorate([
    Orm_1.column.date({ columnName: 'birth_date', serializeAs: 'birthDate' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "birthDate", void 0);
__decorate([
    Orm_1.column.date({ columnName: 'death_date', serializeAs: 'deathDate' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "deathDate", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'death_date_unknown', serializeAs: 'deathDateUnknown' }),
    __metadata("design:type", Boolean)
], DeathCertificate.prototype, "deathDateUnknown", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'death_time', serializeAs: 'deathTime' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "deathTime", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'death_time_unknown', serializeAs: 'deathTimeUnknown' }),
    __metadata("design:type", Boolean)
], DeathCertificate.prototype, "deathTimeUnknown", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "age", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'age_type', serializeAs: 'ageType' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "ageType", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'stable_union', serializeAs: 'stableUnion' }),
    __metadata("design:type", Boolean)
], DeathCertificate.prototype, "stableUnion", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'marital_status', serializeAs: 'maritalStatus' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "maritalStatus", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "race", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'other_occupation', serializeAs: 'otherOccupation' }),
    __metadata("design:type", Boolean)
], DeathCertificate.prototype, "otherOccupation", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'former_spouse_name', serializeAs: 'formerSpouseName' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "formerSpouseName", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'former_spouse_book_number', serializeAs: 'formerSpouseBookNumber' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "formerSpouseBookNumber", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'former_spouse_sheet_number', serializeAs: 'formerSpouseSheetNumber' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "formerSpouseSheetNumber", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'former_spouse_term_number', serializeAs: 'formerSpouseTermNumber' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "formerSpouseTermNumber", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'former_spouse_registry_office', serializeAs: 'formerSpouseRegistryOffice' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "formerSpouseRegistryOffice", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_found_alive', serializeAs: 'occurrenceFoundAlive' }),
    __metadata("design:type", Boolean)
], DeathCertificate.prototype, "occurrenceFoundAlive", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_location_type', serializeAs: 'occurrenceLocationType' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "occurrenceLocationType", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_zip_code', serializeAs: 'occurrenceZipCode' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "occurrenceZipCode", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_address', serializeAs: 'occurrenceAddress' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "occurrenceAddress", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_street_number', serializeAs: 'occurrenceStreetNumber' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "occurrenceStreetNumber", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_district', serializeAs: 'occurrenceDistrict' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "occurrenceDistrict", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_country', serializeAs: 'occurrenceCountry' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "occurrenceCountry", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_state', serializeAs: 'occurrenceState' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "occurrenceState", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_city', serializeAs: 'occurrenceCity' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "occurrenceCity", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'occurrence_subdistrict', serializeAs: 'occurrenceSubdistrict' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "occurrenceSubdistrict", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'deceased_residence_country', serializeAs: 'deceasedResidenceCountry' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "deceasedResidenceCountry", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'burial_status', serializeAs: 'burialStatus' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "burialStatus", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'cremation_manifestation', serializeAs: 'cremationManifestation' }),
    __metadata("design:type", Boolean)
], DeathCertificate.prototype, "cremationManifestation", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'burial_witnesses', serializeAs: 'burialWitnesses' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "burialWitnesses", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'burial_state', serializeAs: 'burialState' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "burialState", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'burial_city', serializeAs: 'burialCity' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "burialCity", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'will_be_cremated', serializeAs: 'willBeCremated' }),
    __metadata("design:type", Boolean)
], DeathCertificate.prototype, "willBeCremated", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'burial_place', serializeAs: 'burialPlace' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "burialPlace", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'burial_doctor', serializeAs: 'burialDoctor' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "burialDoctor", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'burial_doctor_crm', serializeAs: 'burialDoctorCrm' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "burialDoctorCrm", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'burial_observation', serializeAs: 'burialObservation' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "burialObservation", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation1_naturalness_ignored', serializeAs: 'filiation1NaturalnessIgnored' }),
    __metadata("design:type", Boolean)
], DeathCertificate.prototype, "filiation1NaturalnessIgnored", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation1_birth_state', serializeAs: 'filiation1BirthState' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "filiation1BirthState", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation1_birth_city', serializeAs: 'filiation1BirthCity' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "filiation1BirthCity", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation1_other_occupation', serializeAs: 'filiation1OtherOccupation' }),
    __metadata("design:type", Boolean)
], DeathCertificate.prototype, "filiation1OtherOccupation", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation1_residence_country', serializeAs: 'filiation1ResidenceCountry' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "filiation1ResidenceCountry", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation2_naturalness_ignored', serializeAs: 'filiation2NaturalnessIgnored' }),
    __metadata("design:type", Boolean)
], DeathCertificate.prototype, "filiation2NaturalnessIgnored", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation2_birth_state', serializeAs: 'filiation2BirthState' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "filiation2BirthState", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation2_birth_city', serializeAs: 'filiation2BirthCity' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "filiation2BirthCity", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation2_other_occupation', serializeAs: 'filiation2OtherOccupation' }),
    __metadata("design:type", Boolean)
], DeathCertificate.prototype, "filiation2OtherOccupation", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'filiation2_residence_country', serializeAs: 'filiation2ResidenceCountry' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "filiation2ResidenceCountry", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'declarant_type', serializeAs: 'declarantType' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "declarantType", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'declarant_other_occupation', serializeAs: 'declarantOtherOccupation' }),
    __metadata("design:type", Boolean)
], DeathCertificate.prototype, "declarantOtherOccupation", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'declarant_birth_state', serializeAs: 'declarantBirthState' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "declarantBirthState", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'declarant_birth_city', serializeAs: 'declarantBirthCity' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "declarantBirthCity", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'declarant_residence_country', serializeAs: 'declarantResidenceCountry' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "declarantResidenceCountry", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'electronic_address', serializeAs: 'electronicAddress' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "electronicAddress", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "phone", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "obs", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], DeathCertificate.prototype, "inactive", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'status_form', serializeAs: 'statusForm' }),
    __metadata("design:type", String)
], DeathCertificate.prototype, "statusForm", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Company_1.default, { foreignKey: 'companiesId' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "company", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => User_1.default, { foreignKey: 'usrId' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "user", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Status_1.default, { foreignKey: 'statusId' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "status", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'deceasedPersonId' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "deceased", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'filiation1PersonId' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "filiation1", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'filiation2PersonId' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "filiation2", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'declarantPersonId' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "declarant", void 0);
__decorate([
    (0, Orm_1.hasMany)(() => EmployeeVerificationXCertificate_1.default, { foreignKey: 'deathCertificateId' }),
    __metadata("design:type", Object)
], DeathCertificate.prototype, "employeeVerificationXCertificates", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'created_at', autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], DeathCertificate.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'updated_at', autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], DeathCertificate.prototype, "updatedAt", void 0);
exports.default = DeathCertificate;
//# sourceMappingURL=DeathCertificate.js.map