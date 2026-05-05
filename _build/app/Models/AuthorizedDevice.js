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
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const Orm_1 = global[Symbol.for('ioc.use')]("Adonis/Lucid/Orm");
class AuthorizedDevice extends Orm_1.BaseModel {
}
AuthorizedDevice.table = 'authorized_devices';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], AuthorizedDevice.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'company_id' }),
    __metadata("design:type", Number)
], AuthorizedDevice.prototype, "companyId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'user_id' }),
    __metadata("design:type", Object)
], AuthorizedDevice.prototype, "userId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'device_name' }),
    __metadata("design:type", String)
], AuthorizedDevice.prototype, "deviceName", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'device_identifier' }),
    __metadata("design:type", String)
], AuthorizedDevice.prototype, "deviceIdentifier", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], AuthorizedDevice.prototype, "active", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'last_used_at' }),
    __metadata("design:type", Object)
], AuthorizedDevice.prototype, "lastUsedAt", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'revoked_at' }),
    __metadata("design:type", Object)
], AuthorizedDevice.prototype, "revokedAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, columnName: 'created_at' }),
    __metadata("design:type", luxon_1.DateTime)
], AuthorizedDevice.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' }),
    __metadata("design:type", luxon_1.DateTime)
], AuthorizedDevice.prototype, "updatedAt", void 0);
exports.default = AuthorizedDevice;
//# sourceMappingURL=AuthorizedDevice.js.map