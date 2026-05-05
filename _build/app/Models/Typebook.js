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
const Indeximage_1 = __importDefault(require("./Indeximage"));
const Book_1 = __importDefault(require("./Book"));
const Company_1 = __importDefault(require("./Company"));
const Bookrecord_1 = __importDefault(require("./Bookrecord"));
const DocumentConfig_1 = __importDefault(require("./DocumentConfig"));
class Typebook extends Orm_1.BaseModel {
    static get fillable() {
        return [
            'id',
            'name',
            'status',
            'path',
            'books_id',
            'companies_id',
            'totalfiles',
            'dateindex',
            'createdAt',
            'updatedAt',
        ];
    }
}
__decorate([
    (0, Orm_1.hasMany)(() => Bookrecord_1.default, {
        foreignKey: 'typebooks_id',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], Typebook.prototype, "bookrecords", void 0);
__decorate([
    (0, Orm_1.hasMany)(() => DocumentConfig_1.default, {
        foreignKey: 'typebooks_id',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], Typebook.prototype, "documentconfig", void 0);
__decorate([
    (0, Orm_1.hasMany)(() => Indeximage_1.default, {
        foreignKey: 'typebooks_id',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], Typebook.prototype, "typebooks", void 0);
__decorate([
    (0, Orm_1.hasOne)(() => Book_1.default, {
        foreignKey: 'id',
        localKey: 'books_id'
    }),
    __metadata("design:type", Object)
], Typebook.prototype, "book", void 0);
__decorate([
    (0, Orm_1.hasOne)(() => Company_1.default, {
        foreignKey: 'id',
        localKey: 'companies_id'
    }),
    __metadata("design:type", Object)
], Typebook.prototype, "company", void 0);
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Typebook.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Typebook.prototype, "companies_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Typebook.prototype, "name", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Typebook.prototype, "status", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Typebook.prototype, "path", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Typebook.prototype, "books_id", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Typebook.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Typebook.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Typebook.prototype, "totalfiles", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Typebook.prototype, "dateindex", void 0);
exports.default = Typebook;
//# sourceMappingURL=Typebook.js.map