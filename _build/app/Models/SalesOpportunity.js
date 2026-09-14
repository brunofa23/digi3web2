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
const Company_1 = __importDefault(require("./Company"));
const SalesStage_1 = __importDefault(require("./SalesStage"));
class SalesOpportunity extends Orm_1.BaseModel {
}
SalesOpportunity.table = 'sales_opportunities';
SalesOpportunity.fillable = ['company_id', 'sales_stage_id', 'name', 'city', 'contact_name', 'phone', 'interest', 'notes', 'last_contact_date', 'next_contact_date', 'proposal_value'];
__decorate([
    (0, Orm_1.belongsTo)(() => Company_1.default, { foreignKey: 'company_id' }),
    __metadata("design:type", Object)
], SalesOpportunity.prototype, "company", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => SalesStage_1.default, { foreignKey: 'sales_stage_id' }),
    __metadata("design:type", Object)
], SalesOpportunity.prototype, "stage", void 0);
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], SalesOpportunity.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SalesOpportunity.prototype, "company_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], SalesOpportunity.prototype, "sales_stage_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], SalesOpportunity.prototype, "name", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SalesOpportunity.prototype, "city", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SalesOpportunity.prototype, "contact_name", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SalesOpportunity.prototype, "phone", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SalesOpportunity.prototype, "interest", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SalesOpportunity.prototype, "notes", void 0);
__decorate([
    Orm_1.column.date(),
    __metadata("design:type", Object)
], SalesOpportunity.prototype, "last_contact_date", void 0);
__decorate([
    Orm_1.column.date(),
    __metadata("design:type", Object)
], SalesOpportunity.prototype, "next_contact_date", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], SalesOpportunity.prototype, "proposal_value", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], SalesOpportunity.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], SalesOpportunity.prototype, "updatedAt", void 0);
exports.default = SalesOpportunity;
//# sourceMappingURL=SalesOpportunity.js.map