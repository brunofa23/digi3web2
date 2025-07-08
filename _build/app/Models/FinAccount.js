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
const FinClass_1 = __importDefault(require("./FinClass"));
const FinEmp_1 = __importDefault(require("./FinEmp"));
const FinPaymentMethod_1 = __importDefault(require("./FinPaymentMethod"));
const Entity_1 = __importDefault(require("./Entity"));
class FinAccount extends Orm_1.BaseModel {
    static get fillable() {
        return [
            'id',
            'companies_id',
            'fin_emp_id',
            'fin_class_id',
            'fin_paymentmethod_id',
            'id_replication',
            'entity_id',
            'description',
            'amount',
            'amount_paid',
            'date',
            'date_due',
            'replicate',
            'data_billing',
            'date_conciliation',
            'excluded',
            'debit_credit',
            'cost',
            'ir',
            'obs',
            'analyze',
            'future',
            'reserve',
            'overplus',
            'limit_amount',
        ];
    }
}
__decorate([
    (0, Orm_1.hasOne)(() => FinClass_1.default, {
        foreignKey: 'id',
        localKey: 'fin_class_id'
    }),
    __metadata("design:type", Object)
], FinAccount.prototype, "finclass", void 0);
__decorate([
    (0, Orm_1.hasOne)(() => FinEmp_1.default, {
        foreignKey: 'id',
        localKey: 'fin_emp_id'
    }),
    __metadata("design:type", Object)
], FinAccount.prototype, "finemp", void 0);
__decorate([
    (0, Orm_1.hasOne)(() => FinPaymentMethod_1.default, {
        foreignKey: 'id',
        localKey: 'fin_paymentmethod_id'
    }),
    __metadata("design:type", Object)
], FinAccount.prototype, "finPaymentMethod", void 0);
__decorate([
    (0, Orm_1.hasOne)(() => Entity_1.default, {
        foreignKey: 'id',
        localKey: 'entity_id'
    }),
    __metadata("design:type", Object)
], FinAccount.prototype, "entity", void 0);
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], FinAccount.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], FinAccount.prototype, "companies_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], FinAccount.prototype, "fin_emp_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], FinAccount.prototype, "fin_class_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], FinAccount.prototype, "fin_paymentmethod_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], FinAccount.prototype, "id_replication", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], FinAccount.prototype, "entity_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], FinAccount.prototype, "description", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], FinAccount.prototype, "amount", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], FinAccount.prototype, "amount_paid", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", luxon_1.DateTime)
], FinAccount.prototype, "date", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", luxon_1.DateTime)
], FinAccount.prototype, "date_due", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], FinAccount.prototype, "replicate", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], FinAccount.prototype, "analyze", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], FinAccount.prototype, "future", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], FinAccount.prototype, "reserve", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], FinAccount.prototype, "overplus", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], FinAccount.prototype, "limit_amount", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", luxon_1.DateTime)
], FinAccount.prototype, "data_billing", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", luxon_1.DateTime)
], FinAccount.prototype, "date_conciliation", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], FinAccount.prototype, "excluded", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], FinAccount.prototype, "debit_credit", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], FinAccount.prototype, "cost", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], FinAccount.prototype, "ir", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], FinAccount.prototype, "obs", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], FinAccount.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], FinAccount.prototype, "updatedAt", void 0);
exports.default = FinAccount;
//# sourceMappingURL=FinAccount.js.map