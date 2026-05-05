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
const Hash_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Hash"));
const Orm_1 = global[Symbol.for('ioc.use')]("Adonis/Lucid/Orm");
class Apitoken extends Orm_1.BaseModel {
    static async hashPassword(apitoken) {
        if (apitoken.$dirty.password) {
            apitoken.password = await Hash_1.default.make(apitoken.password);
        }
    }
}
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Apitoken.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Apitoken.prototype, "email", void 0);
__decorate([
    (0, Orm_1.column)({ serializeAs: null }),
    __metadata("design:type", String)
], Apitoken.prototype, "password", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], Apitoken.prototype, "rememberMeToken", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Apitoken.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Apitoken.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.column)({
        prepare: (value) => JSON.stringify(value),
        consume: (value) => JSON.parse(value),
    }),
    __metadata("design:type", Object)
], Apitoken.prototype, "payload", void 0);
__decorate([
    (0, Orm_1.beforeSave)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Apitoken]),
    __metadata("design:returntype", Promise)
], Apitoken, "hashPassword", null);
exports.default = Apitoken;
//# sourceMappingURL=Apitoken.js.map