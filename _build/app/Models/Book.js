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
const Typebook_1 = __importDefault(require("./Typebook"));
const Bookrecord_1 = __importDefault(require("./Bookrecord"));
class Book extends Orm_1.BaseModel {
    static get fillable() {
        return [
            'id',
            'name',
            'namefolder',
            'status',
            'createdAt',
            'updatedAt'
        ];
    }
}
__decorate([
    (0, Orm_1.hasMany)(() => Typebook_1.default, {
        foreignKey: 'books_id',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], Book.prototype, "typebooks", void 0);
__decorate([
    (0, Orm_1.hasMany)(() => Bookrecord_1.default, {
        foreignKey: 'books_id',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], Book.prototype, "bookrecords", void 0);
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Book.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Book.prototype, "name", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Book.prototype, "namefolder", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Book.prototype, "status", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Book.prototype, "created_at", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Book.prototype, "updated_at", void 0);
__decorate([
    (0, Orm_1.hasManyThrough)([
        () => Bookrecord_1.default,
        () => Typebook_1.default,
    ]),
    __metadata("design:type", Object)
], Book.prototype, "posts", void 0);
exports.default = Book;
//# sourceMappingURL=Book.js.map