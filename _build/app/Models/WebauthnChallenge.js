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
class WebauthnChallenge extends Orm_1.BaseModel {
}
WebauthnChallenge.table = 'webauthn_challenges';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], WebauthnChallenge.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'company_id' }),
    __metadata("design:type", Number)
], WebauthnChallenge.prototype, "companyId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'user_id' }),
    __metadata("design:type", Object)
], WebauthnChallenge.prototype, "userId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'token_device_id' }),
    __metadata("design:type", Object)
], WebauthnChallenge.prototype, "tokenDeviceId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], WebauthnChallenge.prototype, "type", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], WebauthnChallenge.prototype, "challenge", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'device_name' }),
    __metadata("design:type", Object)
], WebauthnChallenge.prototype, "deviceName", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'expires_at' }),
    __metadata("design:type", luxon_1.DateTime)
], WebauthnChallenge.prototype, "expiresAt", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'used_at' }),
    __metadata("design:type", Object)
], WebauthnChallenge.prototype, "usedAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, columnName: 'created_at' }),
    __metadata("design:type", luxon_1.DateTime)
], WebauthnChallenge.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' }),
    __metadata("design:type", luxon_1.DateTime)
], WebauthnChallenge.prototype, "updatedAt", void 0);
exports.default = WebauthnChallenge;
//# sourceMappingURL=WebauthnChallenge.js.map