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
const User_1 = __importDefault(require("./User"));
function parseJson(value) {
    if (!value)
        return null;
    if (typeof value === 'string')
        return JSON.parse(value);
    return value;
}
class AuditLog extends Orm_1.BaseModel {
}
AuditLog.table = 'audit_logs';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], AuditLog.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], AuditLog.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], AuditLog.prototype, "userId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], AuditLog.prototype, "entityTable", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], AuditLog.prototype, "entityId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], AuditLog.prototype, "resourceKey", void 0);
__decorate([
    (0, Orm_1.column)({
        prepare: (value) => value === undefined ? null : JSON.stringify(value),
        consume: parseJson,
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "entityKey", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], AuditLog.prototype, "description", void 0);
__decorate([
    (0, Orm_1.column)({
        prepare: (value) => value === undefined ? null : JSON.stringify(value),
        consume: parseJson,
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "metadata", void 0);
__decorate([
    (0, Orm_1.column)({
        prepare: (value) => value === undefined ? null : JSON.stringify(value),
        consume: parseJson,
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "changedFields", void 0);
__decorate([
    (0, Orm_1.column)({
        prepare: (value) => value === undefined ? null : JSON.stringify(value),
        consume: parseJson,
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "beforeData", void 0);
__decorate([
    (0, Orm_1.column)({
        prepare: (value) => value === undefined ? null : JSON.stringify(value),
        consume: parseJson,
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "afterData", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], AuditLog.prototype, "occurrenceCount", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", Object)
], AuditLog.prototype, "firstAt", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", Object)
], AuditLog.prototype, "lastAt", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], AuditLog.prototype, "ip", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], AuditLog.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], AuditLog.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Company_1.default, {
        foreignKey: 'companiesId',
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "company", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => User_1.default, {
        foreignKey: 'userId',
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "user", void 0);
exports.default = AuditLog;
//# sourceMappingURL=AuditLog.js.map