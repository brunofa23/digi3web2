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
const Occupation_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Occupation"));
class Person extends Orm_1.BaseModel {
}
Person.table = 'people';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Person.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'companies_id',
        serializeAs: 'companiesId',
    }),
    __metadata("design:type", Number)
], Person.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Person.prototype, "name", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'name_married',
        serializeAs: 'nameMarried',
    }),
    __metadata("design:type", String)
], Person.prototype, "nameMarried", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Person.prototype, "cpf", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Person.prototype, "gender", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Person.prototype, "deceased", void 0);
__decorate([
    Orm_1.column.date({
        columnName: 'date_birth',
        serializeAs: 'dateBirth',
    }),
    __metadata("design:type", luxon_1.DateTime)
], Person.prototype, "dateBirth", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'marital_status',
        serializeAs: 'maritalStatus',
    }),
    __metadata("design:type", String)
], Person.prototype, "maritalStatus", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'illiterate',
        serializeAs: 'illiterate',
    }),
    __metadata("design:type", Boolean)
], Person.prototype, "illiterate", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'place_birth',
        serializeAs: 'placeBirth',
    }),
    __metadata("design:type", String)
], Person.prototype, "placeBirth", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Person.prototype, "nationality", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'occupation_id',
        serializeAs: 'occupationId',
    }),
    __metadata("design:type", Object)
], Person.prototype, "occupationId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Person.prototype, "mother", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Person.prototype, "father", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'zip_code',
        serializeAs: 'zipCode',
    }),
    __metadata("design:type", String)
], Person.prototype, "zipCode", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Person.prototype, "address", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'street_number',
        serializeAs: 'streetNumber',
    }),
    __metadata("design:type", String)
], Person.prototype, "streetNumber", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'street_complement',
        serializeAs: 'streetComplement',
    }),
    __metadata("design:type", String)
], Person.prototype, "streetComplement", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Person.prototype, "district", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Person.prototype, "city", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Person.prototype, "state", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'document_type',
        serializeAs: 'documentType',
    }),
    __metadata("design:type", String)
], Person.prototype, "documentType", void 0);
__decorate([
    (0, Orm_1.column)({
        columnName: 'document_number',
        serializeAs: 'documentNumber',
    }),
    __metadata("design:type", String)
], Person.prototype, "documentNumber", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Person.prototype, "phone", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Person.prototype, "cellphone", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Person.prototype, "email", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Person.prototype, "inactive", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Company_1.default, {
        foreignKey: 'companiesId',
    }),
    __metadata("design:type", Object)
], Person.prototype, "company", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Occupation_1.default, {
        foreignKey: 'occupationId',
    }),
    __metadata("design:type", Object)
], Person.prototype, "occupation", void 0);
__decorate([
    Orm_1.column.dateTime({
        columnName: 'created_at',
        serializeAs: 'createdAt',
        autoCreate: true
    }),
    __metadata("design:type", luxon_1.DateTime)
], Person.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({
        columnName: 'updated_at',
        serializeAs: 'updatedAt',
        autoCreate: true,
        autoUpdate: true
    }),
    __metadata("design:type", luxon_1.DateTime)
], Person.prototype, "updatedAt", void 0);
exports.default = Person;
//# sourceMappingURL=Person.js.map