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
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
class MarriedCertificate extends Orm_1.BaseModel {
}
MarriedCertificate.table = 'married_certificates';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], MarriedCertificate.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'companies_id',
        serializeAs: 'companiesId',
    }),
    __metadata("design:type", Number)
], MarriedCertificate.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'groom_person_id',
        serializeAs: 'groomPersonId',
    }),
    __metadata("design:type", Number)
], MarriedCertificate.prototype, "groomPersonId", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'father_groom_person_id',
        serializeAs: 'fatherGroomPersonId',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "fatherGroomPersonId", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'mother_groom_person_id',
        serializeAs: 'motherGroomPersonId',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "motherGroomPersonId", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'bride_person_id',
        serializeAs: 'bridePersonId',
    }),
    __metadata("design:type", Number)
], MarriedCertificate.prototype, "bridePersonId", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'fahter_bride_person_id',
        serializeAs: 'fatherBridePersonId',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "fahterBridePersonId", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'mother_bride_person_id',
        serializeAs: 'motherBridePersonId',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "motherBridePersonId", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'witness_person_id',
        serializeAs: 'witnessPersonId',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "witnessPersonId", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'witness2_person_id',
        serializeAs: 'witness2PersonId',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "witness2PersonId", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'usr_id',
        serializeAs: 'usrId',
    }),
    __metadata("design:type", Number)
], MarriedCertificate.prototype, "usrId", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'status_id',
        serializeAs: 'statusId',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "statusId", void 0);
__decorate([
    Orm_1.column.dateTime({
        columnName: 'dthr_schedule',
        serializeAs: 'dthrSchedule',
        serialize: (value) => {
            if (!value)
                return null;
            return value.setZone('America/Sao_Paulo').toFormat("yyyy-LL-dd'T'HH:mm");
        },
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "dthrSchedule", void 0);
__decorate([
    Orm_1.column.dateTime({
        columnName: 'dthr_marriage',
        serializeAs: 'dthrMarriage',
        serialize: (value) => (value ? value.toISODate() : null),
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "dthrMarriage", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], MarriedCertificate.prototype, "type", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], MarriedCertificate.prototype, "obs", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'church_name',
        serializeAs: 'churchName',
    }),
    __metadata("design:type", String)
], MarriedCertificate.prototype, "churchName", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'church_city',
        serializeAs: 'churchCity',
    }),
    __metadata("design:type", String)
], MarriedCertificate.prototype, "churchCity", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'marital_regime',
        serializeAs: 'maritalRegime',
    }),
    __metadata("design:type", String)
], MarriedCertificate.prototype, "maritalRegime", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], MarriedCertificate.prototype, "prenup", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'registry_office_prenup',
        serializeAs: 'registryOfficePrenup',
    }),
    __metadata("design:type", String)
], MarriedCertificate.prototype, "registryOfficePrenup", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'addres_registry_office_prenup',
        serializeAs: 'addresRegistryOfficePrenup',
    }),
    __metadata("design:type", String)
], MarriedCertificate.prototype, "addresRegistryOfficePrenup", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'book_registry_office_prenup',
        serializeAs: 'bookRegistryOfficePrenup',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "bookRegistryOfficePrenup", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'sheet_registry_office_prenup',
        serializeAs: 'sheetRegistryOfficePrenup',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "sheetRegistryOfficePrenup", void 0);
__decorate([
    Orm_1.column.date({
        columnName: 'dthr_prenup',
        serializeAs: 'dthrPrenup',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "dthrPrenup", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'cerimony_location',
        serializeAs: 'cerimonyLocation',
    }),
    __metadata("design:type", String)
], MarriedCertificate.prototype, "cerimonyLocation", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'other_cerimony_location',
        serializeAs: 'otherCerimonyLocation',
    }),
    __metadata("design:type", String)
], MarriedCertificate.prototype, "otherCerimonyLocation", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'name_former_spouse',
        serializeAs: 'nameFormerSpouse',
    }),
    __metadata("design:type", String)
], MarriedCertificate.prototype, "nameFormerSpouse", void 0);
__decorate([
    Orm_1.column.date({
        columnName: 'dthr_divorce_spouse',
        serializeAs: 'dthrDivorceSpouse',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "dthrDivorceSpouse", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'name_former_spouse2',
        serializeAs: 'nameFormerSpouse2',
    }),
    __metadata("design:type", String)
], MarriedCertificate.prototype, "nameFormerSpouse2", void 0);
__decorate([
    Orm_1.column.date({
        columnName: 'dthr_divorce_spouse2',
        serializeAs: 'dthrDivorceSpouse2',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "dthrDivorceSpouse2", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'typebook_id',
        serializeAs: 'typebookId',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "typebookId", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'book1',
        serializeAs: 'book1',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "book1", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'sheet1',
        serializeAs: 'sheet1',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "sheet1", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'term1',
        serializeAs: 'term1',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "term1", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'typebook_id2',
        serializeAs: 'typebookId2',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "typebookId2", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'book2',
        serializeAs: 'book2',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "book2", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'sheet2',
        serializeAs: 'sheet2',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "sheet2", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'term2',
        serializeAs: 'term2',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "term2", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], MarriedCertificate.prototype, "inactive", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'status_form',
        serializeAs: 'statusForm',
    }),
    __metadata("design:type", String)
], MarriedCertificate.prototype, "statusForm", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Company_1.default, {
        foreignKey: 'companiesId',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "company", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => User_1.default, {
        foreignKey: 'usrId',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "user", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Status_1.default, {
        foreignKey: 'statusId',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "status", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'groomPersonId' }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "groom", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'fatherGroomPersonId' }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "fatherGroom", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'motherGroomPersonId' }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "motherGroom", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'bridePersonId' }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "bride", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, {
        foreignKey: 'fahterBridePersonId',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "fatherBride", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'motherBridePersonId' }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "motherBride", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'witnessPersonId' }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "witness1", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'witness2PersonId' }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "witness2", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Typebook_1.default, {
        foreignKey: 'typebookId',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "typebook1", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Typebook_1.default, {
        foreignKey: 'typebookId2',
    }),
    __metadata("design:type", Object)
], MarriedCertificate.prototype, "typebook2", void 0);
__decorate([
    Orm_1.column.dateTime({
        columnName: 'created_at',
        serializeAs: 'createdAt',
        autoCreate: true,
    }),
    __metadata("design:type", luxon_1.DateTime)
], MarriedCertificate.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({
        columnName: 'updated_at',
        serializeAs: 'updatedAt',
        autoCreate: true,
        autoUpdate: true,
    }),
    __metadata("design:type", luxon_1.DateTime)
], MarriedCertificate.prototype, "updatedAt", void 0);
exports.default = MarriedCertificate;
//# sourceMappingURL=MarriedCertificate.js.map