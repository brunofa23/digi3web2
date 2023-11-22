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
const Typebook_1 = __importDefault(require("./Typebook"));
const Company_1 = __importDefault(require("./Company"));
const fileRename = require('../Services/fileRename/fileRename');
class Bookrecord extends Orm_1.BaseModel {
    static get fillable() {
        return [
            'id',
            'typebooks_id',
            'books_id',
            'companies_id',
            'cod',
            'book',
            'sheet',
            'side',
            'approximate_term',
            'indexbook',
            'obs',
            'letter',
            'year',
            'model',
            'userid',
            'createdAt',
            'updatedAt',
        ];
    }
    static async verifyUpdate(bookRecord) {
        console.log("PASSEI PELO AFTER UPDATE MODEL");
        fileRename.updateFileName(bookRecord);
    }
}
__decorate([
    (0, Orm_1.hasMany)(() => Indeximage_1.default, {
        foreignKey: 'bookrecords_id',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], Bookrecord.prototype, "bookrecords", void 0);
__decorate([
    (0, Orm_1.hasMany)(() => Indeximage_1.default, {
        foreignKey: 'bookrecords_id',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], Bookrecord.prototype, "indeximage", void 0);
__decorate([
    (0, Orm_1.hasOne)(() => Typebook_1.default, {
        foreignKey: 'id',
        localKey: 'typebooks_id'
    }),
    __metadata("design:type", Object)
], Bookrecord.prototype, "typebooks", void 0);
__decorate([
    (0, Orm_1.hasOne)(() => Company_1.default, {
        foreignKey: 'id',
        localKey: 'companies_id'
    }),
    __metadata("design:type", Object)
], Bookrecord.prototype, "companies", void 0);
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Bookrecord.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Bookrecord.prototype, "typebooks_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Bookrecord.prototype, "companies_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Bookrecord.prototype, "books_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Bookrecord.prototype, "cod", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Bookrecord.prototype, "book", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Bookrecord.prototype, "sheet", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Bookrecord.prototype, "side", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Bookrecord.prototype, "approximate_term", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Bookrecord.prototype, "indexbook", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Bookrecord.prototype, "obs", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Bookrecord.prototype, "letter", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Bookrecord.prototype, "year", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Bookrecord.prototype, "model", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Bookrecord.prototype, "userid", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Bookrecord.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Bookrecord.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.afterUpdate)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Bookrecord]),
    __metadata("design:returntype", Promise)
], Bookrecord, "verifyUpdate", null);
exports.default = Bookrecord;
//# sourceMappingURL=Bookrecord.js.map