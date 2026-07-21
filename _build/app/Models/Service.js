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
const Emolument_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Emolument"));
class Service extends Orm_1.BaseModel {
}
Service.table = 'services';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Service.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'companies_id' }),
    __metadata("design:type", Number)
], Service.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Service.prototype, "name", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Service.prototype, "description", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Service.prototype, "free", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Service.prototype, "inactive", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, columnName: 'created_at' }),
    __metadata("design:type", luxon_1.DateTime)
], Service.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' }),
    __metadata("design:type", luxon_1.DateTime)
], Service.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Company_1.default, { foreignKey: 'companiesId' }),
    __metadata("design:type", Object)
], Service.prototype, "company", void 0);
__decorate([
    (0, Orm_1.manyToMany)(() => Emolument_1.default, {
        pivotTable: 'emolument_service',
        pivotForeignKey: 'service_id',
        pivotRelatedForeignKey: 'emolument_id',
        pivotColumns: ['companies_id'],
        pivotTimestamps: true,
    }),
    __metadata("design:type", Object)
], Service.prototype, "emoluments", void 0);
exports.default = Service;
//# sourceMappingURL=Service.js.map