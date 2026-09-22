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
const Service_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Service"));
class Emolument extends Orm_1.BaseModel {
}
Emolument.table = 'emoluments';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Emolument.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'companies_id' }),
    __metadata("design:type", Number)
], Emolument.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Company_1.default, { foreignKey: 'companiesId' }),
    __metadata("design:type", Object)
], Emolument.prototype, "company", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Emolument.prototype, "name", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Emolument.prototype, "description", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Emolument.prototype, "price", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Emolument.prototype, "code", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Emolument.prototype, "type", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Emolument.prototype, "inactive", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Emolument.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Emolument.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.manyToMany)(() => Service_1.default, {
        pivotTable: 'emolument_service',
        pivotForeignKey: 'emolument_id',
        pivotRelatedForeignKey: 'service_id',
        pivotColumns: ['companies_id'],
        pivotTimestamps: true,
    }),
    __metadata("design:type", Object)
], Emolument.prototype, "services", void 0);
exports.default = Emolument;
//# sourceMappingURL=Emolument.js.map