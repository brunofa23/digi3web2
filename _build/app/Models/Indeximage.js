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
const Bookrecord_1 = __importDefault(require("./Bookrecord"));
class Indeximage extends Orm_1.BaseModel {
    static get fillable() {
        return [
            'bookrecords_id',
            'typebooks_id',
            'companies_id',
            'seq',
            'ext',
            'file_name',
            'previous_file_name',
            'created_at',
            'updated_at'
        ];
    }
}
__decorate([
    (0, Orm_1.hasOne)(() => Bookrecord_1.default, {
        foreignKey: 'id',
        localKey: 'bookrecords_id'
    }),
    __metadata("design:type", Object)
], Indeximage.prototype, "bookrecord", void 0);
__decorate([
    (0, Orm_1.hasOne)(() => Bookrecord_1.default, {
        foreignKey: 'typebooks_id',
        localKey: 'typebooks_id'
    }),
    __metadata("design:type", Object)
], Indeximage.prototype, "typebooks", void 0);
__decorate([
    (0, Orm_1.hasOne)(() => Bookrecord_1.default, {
        foreignKey: 'companies_id',
        localKey: 'companies_id'
    }),
    __metadata("design:type", Object)
], Indeximage.prototype, "companies", void 0);
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Indeximage.prototype, "bookrecords_id", void 0);
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Indeximage.prototype, "typebooks_id", void 0);
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Indeximage.prototype, "companies_id", void 0);
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Indeximage.prototype, "seq", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Indeximage.prototype, "ext", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Indeximage.prototype, "file_name", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Indeximage.prototype, "previous_file_name", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Indeximage.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Indeximage.prototype, "updatedAt", void 0);
exports.default = Indeximage;
//# sourceMappingURL=Indeximage.js.map