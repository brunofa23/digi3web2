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
const Typebook_1 = __importDefault(require("./Typebook"));
const User_1 = __importDefault(require("./User"));
const Situation_1 = __importDefault(require("./Situation"));
const Entity_1 = __importDefault(require("./Entity"));
class Company extends Orm_1.BaseModel {
    static get fillable() {
        return [
            'id',
            'name',
            'shortname',
            'foldername',
            'address',
            'number',
            'complement',
            'postalcode',
            'district',
            'city',
            'state',
            'cnpj',
            'responsablename',
            'phoneresponsable',
            'email',
            'status',
            'cloud',
            'use_device_control',
            'use_device_cookie_control',
            'module_books',
            'module_financial',
            'module_lgpd',
            'obs',
            'licence_value',
            'due_date',
            'fin_entity_id',
            'created_at',
            'updated_at'
        ];
    }
    static async afterCreateHook(company) {
        const foldername = `Client_${company.id.toString()}`;
        if (company.foldername !== foldername) {
            company.foldername = foldername;
            await company.save();
        }
    }
}
__decorate([
    (0, Orm_1.hasMany)(() => Typebook_1.default, {
        foreignKey: 'companies_id',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], Company.prototype, "typebooks", void 0);
__decorate([
    (0, Orm_1.hasMany)(() => User_1.default, {
        foreignKey: 'companies_id',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], Company.prototype, "user", void 0);
__decorate([
    (0, Orm_1.manyToMany)(() => Situation_1.default, {
        localKey: 'id',
        relatedKey: 'id',
        pivotTable: 'company_situation',
        pivotForeignKey: 'companies_id',
        pivotRelatedForeignKey: 'situation_id',
    }),
    __metadata("design:type", Object)
], Company.prototype, "situations", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Entity_1.default, {
        foreignKey: 'fin_entity_id',
    }),
    __metadata("design:type", Object)
], Company.prototype, "finentity", void 0);
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Company.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Company.prototype, "name", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Company.prototype, "shortname", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Company.prototype, "foldername", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Company.prototype, "address", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Company.prototype, "number", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Company.prototype, "complement", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Company.prototype, "postalcode", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Company.prototype, "district", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Company.prototype, "city", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Company.prototype, "state", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Company.prototype, "cnpj", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Company.prototype, "responsablename", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Company.prototype, "phoneresponsable", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Company.prototype, "email", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Company.prototype, "status", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Company.prototype, "cloud", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Company.prototype, "use_device_control", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Company.prototype, "use_device_cookie_control", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Company.prototype, "module_books", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Company.prototype, "module_financial", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Company.prototype, "module_lgpd", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Company.prototype, "obs", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Company.prototype, "licence_value", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Company.prototype, "due_date", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Company.prototype, "fin_entity_id", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Company.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Company.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.afterCreate)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Company]),
    __metadata("design:returntype", Promise)
], Company, "afterCreateHook", null);
exports.default = Company;
//# sourceMappingURL=Company.js.map