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
const Encryption_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Encryption"));
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
class Token extends Orm_1.BaseModel {
    static get fillable() {
        return [
            "id",
            "name",
            "token",
            "credentials",
            "accountname",
            "status"
        ];
    }
    static async Encryption(token) {
        if (token.$dirty.token) {
            token.token = await Encryption_1.default.encrypt(token.token);
        }
        if (token.$dirty.credentials) {
            token.credentials = await Encryption_1.default.encrypt(token.credentials);
        }
    }
    static afterFind(token) {
        if (!Helpers_1.types.isNull(token.token))
            token.token = Encryption_1.default.decrypt(token.token);
        if (!Helpers_1.types.isNull(token.credentials))
            token.credentials = Encryption_1.default.decrypt(token.credentials);
    }
}
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Token.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Token.prototype, "name", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Token.prototype, "token", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Token.prototype, "credentials", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Token.prototype, "accountname", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Token.prototype, "status", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Token.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Token.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.beforeSave)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Token]),
    __metadata("design:returntype", Promise)
], Token, "Encryption", null);
__decorate([
    (0, Orm_1.afterFind)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Token]),
    __metadata("design:returntype", void 0)
], Token, "afterFind", null);
exports.default = Token;
//# sourceMappingURL=Token.js.map