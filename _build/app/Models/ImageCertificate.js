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
const Book_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Book"));
const MarriedCertificate_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/MarriedCertificate"));
class ImageCertificate extends Orm_1.BaseModel {
}
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], ImageCertificate.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'companies_id' }),
    __metadata("design:type", Number)
], ImageCertificate.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'book_id' }),
    __metadata("design:type", Number)
], ImageCertificate.prototype, "bookId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'married_certificate_id' }),
    __metadata("design:type", Object)
], ImageCertificate.prototype, "marriedCertificateId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], ImageCertificate.prototype, "seq", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], ImageCertificate.prototype, "ext", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'file_name' }),
    __metadata("design:type", Object)
], ImageCertificate.prototype, "fileName", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], ImageCertificate.prototype, "description", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], ImageCertificate.prototype, "path", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], ImageCertificate.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], ImageCertificate.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Company_1.default, {
        foreignKey: 'companiesId',
    }),
    __metadata("design:type", Object)
], ImageCertificate.prototype, "company", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Book_1.default, {
        foreignKey: 'bookId',
    }),
    __metadata("design:type", Object)
], ImageCertificate.prototype, "book", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => MarriedCertificate_1.default, {
        foreignKey: 'marriedCertificateId',
    }),
    __metadata("design:type", Object)
], ImageCertificate.prototype, "marriedCertificate", void 0);
exports.default = ImageCertificate;
//# sourceMappingURL=ImageCertificate.js.map