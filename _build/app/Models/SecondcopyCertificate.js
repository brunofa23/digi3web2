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
const Documenttype_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Documenttype"));
const Person_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Person"));
const Typebook_1 = __importDefault(require("./Typebook"));
class SecondcopyCertificate extends Orm_1.BaseModel {
}
SecondcopyCertificate.table = 'secondcopy_certificates';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], SecondcopyCertificate.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'companies_id', serializeAs: 'companiesId' }),
    __metadata("design:type", Number)
], SecondcopyCertificate.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'documenttype_id', serializeAs: 'documenttypeId' }),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "documenttypeId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'payment_method', serializeAs: 'paymentMethod' }),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "paymentMethod", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "applicant", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "registered1", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "typebookId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "book1", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "sheet1", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "term1", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "city1", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "registered2", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "book2", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "sheet2", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "city2", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "obs", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], SecondcopyCertificate.prototype, "inactive", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Company_1.default, { foreignKey: 'companiesId' }),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "company", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Documenttype_1.default, { foreignKey: 'documenttypeId' }),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "documenttype", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'applicant' }),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "applicantPerson", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'registered1' }),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "registered1Person", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Person_1.default, { foreignKey: 'registered2' }),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "registered2Person", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Typebook_1.default, { foreignKey: 'typebookId' }),
    __metadata("design:type", Object)
], SecondcopyCertificate.prototype, "typebook", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, columnName: 'created_at' }),
    __metadata("design:type", luxon_1.DateTime)
], SecondcopyCertificate.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' }),
    __metadata("design:type", luxon_1.DateTime)
], SecondcopyCertificate.prototype, "updatedAt", void 0);
exports.default = SecondcopyCertificate;
//# sourceMappingURL=SecondcopyCertificate.js.map