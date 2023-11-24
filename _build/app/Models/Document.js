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
class Document extends Orm_1.BaseModel {
    static get fillable() {
        return [
            'id',
            'typebooks_id',
            'books_id',
            'companies_id',
            'cod',
            'prot',
            'box',
            'classification',
            'intfield1',
            'stringfield1',
            'datefield1',
            'intfield2',
            'stringfield2',
            'datefield2',
            'intfield3',
            'stringfield3',
            'datefield3',
            'intfield4',
            'stringfield4',
            'datefield4',
            'intfield5',
            'stringfield5',
            'datefield5',
            'intfield6',
            'stringfield6',
            'datefield6',
            'intfield7',
            'stringfield7',
            'datefield7',
            'intfield8',
            'stringfield8',
            'datefield8',
            'intfield9',
            'stringfield9',
            'datefield9',
            'intfield10',
            'stringfield10',
            'datefield10',
            'intfield11',
            'stringfield11',
            'datefield11',
            'intfield12',
            'stringfield12',
            'datefield12',
            'intfield13',
            'stringfield13',
            'datefield13'
        ];
    }
}
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Document.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "typebooks_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "companies_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "books_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "cod", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "prot", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "box", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "classification", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "intfield1", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Document.prototype, "stringfield1", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", luxon_1.DateTime)
], Document.prototype, "datefield1", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "intfield2", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Document.prototype, "stringfield2", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", luxon_1.DateTime)
], Document.prototype, "datefield2", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "intfield3", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Document.prototype, "stringfield3", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", luxon_1.DateTime)
], Document.prototype, "datefield3", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "intfield4", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Document.prototype, "stringfield4", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", luxon_1.DateTime)
], Document.prototype, "datefield4", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "intfield5", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Document.prototype, "stringfield5", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", luxon_1.DateTime)
], Document.prototype, "datefield5", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "intfield6", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Document.prototype, "stringfield6", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", luxon_1.DateTime)
], Document.prototype, "datefield6", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "intfield7", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Document.prototype, "stringfield7", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", luxon_1.DateTime)
], Document.prototype, "datefield7", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "intfield8", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Document.prototype, "stringfield8", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", luxon_1.DateTime)
], Document.prototype, "datefield8", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "intfield9", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Document.prototype, "stringfield9", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", luxon_1.DateTime)
], Document.prototype, "datefield9", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "intfield10", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Document.prototype, "stringfield10", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", luxon_1.DateTime)
], Document.prototype, "datefield10", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "intfield11", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Document.prototype, "stringfield11", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", luxon_1.DateTime)
], Document.prototype, "datefield11", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "intfield12", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Document.prototype, "stringfield12", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", luxon_1.DateTime)
], Document.prototype, "datefield12", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Document.prototype, "intfield13", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Document.prototype, "stringfield13", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", luxon_1.DateTime)
], Document.prototype, "datefield13", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Document.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Document.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.hasMany)(() => Indeximage_1.default, {
        foreignKey: 'documents_id',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], Document.prototype, "bookrecords", void 0);
__decorate([
    (0, Orm_1.hasMany)(() => Indeximage_1.default, {
        foreignKey: 'documents_id',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], Document.prototype, "indeximage", void 0);
__decorate([
    (0, Orm_1.hasOne)(() => Typebook_1.default, {
        foreignKey: 'id',
        localKey: 'typebooks_id'
    }),
    __metadata("design:type", Object)
], Document.prototype, "typebooks", void 0);
__decorate([
    (0, Orm_1.hasOne)(() => Company_1.default, {
        foreignKey: 'id',
        localKey: 'companies_id'
    }),
    __metadata("design:type", Object)
], Document.prototype, "companies", void 0);
exports.default = Document;
//# sourceMappingURL=Document.js.map