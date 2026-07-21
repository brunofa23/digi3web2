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
class TokenDevice extends Orm_1.BaseModel {
}
TokenDevice.table = 'tokens_devices';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], TokenDevice.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'company_id' }),
    __metadata("design:type", Number)
], TokenDevice.prototype, "companyId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'created_by_user_id' }),
    __metadata("design:type", Number)
], TokenDevice.prototype, "createdByUserId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], TokenDevice.prototype, "token", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'expires_at' }),
    __metadata("design:type", luxon_1.DateTime)
], TokenDevice.prototype, "expiresAt", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'used_at' }),
    __metadata("design:type", Object)
], TokenDevice.prototype, "usedAt", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], TokenDevice.prototype, "active", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, columnName: 'created_at' }),
    __metadata("design:type", luxon_1.DateTime)
], TokenDevice.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' }),
    __metadata("design:type", luxon_1.DateTime)
], TokenDevice.prototype, "updatedAt", void 0);
exports.default = TokenDevice;
//# sourceMappingURL=TokenDevice.js.map