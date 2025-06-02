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
const Company_1 = __importDefault(require("./Company"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const validations_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Validations/validations"));
const Usergroup_1 = __importDefault(require("./Usergroup"));
class User extends Orm_1.BaseModel {
    static get fillable() {
        return [
            'id',
            'companies_id',
            'usergroup_id',
            'shortname',
            'name',
            'username',
            'email',
            'password',
            'remember_me_token',
            'permission_level',
            'status',
            'work_schedule',
            'access_image',
            'access_images_permanent',
            'token',
            'createdAt',
            'updatedAt'
        ];
    }
    static async hashPassword(user) {
        const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
        if (user.$dirty.password) {
            if (strongPasswordRegex.test(user.$dirty.password) == false) {
                let errorValidation = await new validations_1.default('user_error_207');
                throw new BadRequestException_1.default(errorValidation.messages, errorValidation.status, errorValidation.code);
            }
            user.password = await Hash_1.default.make(user.password);
        }
    }
}
__decorate([
    (0, Orm_1.belongsTo)(() => Company_1.default, {
        foreignKey: 'companies_id',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], User.prototype, "company", void 0);
__decorate([
    (0, Orm_1.hasOne)(() => Usergroup_1.default, {
        foreignKey: 'id',
        localKey: 'usergroup_id'
    }),
    __metadata("design:type", Object)
], User.prototype, "usergroup", void 0);
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], User.prototype, "companies_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], User.prototype, "usergroup_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, Orm_1.column)({ serializeAs: null }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], User.prototype, "rememberMeToken", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], User.prototype, "permission_level", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], User.prototype, "superuser", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], User.prototype, "status", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], User.prototype, "work_schedule", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", luxon_1.DateTime)
], User.prototype, "access_image", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], User.prototype, "access_images_permanent", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], User.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.beforeSave)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [User]),
    __metadata("design:returntype", Promise)
], User, "hashPassword", null);
exports.default = User;
//# sourceMappingURL=User.js.map