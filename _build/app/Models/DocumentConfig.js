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
const Document_1 = __importDefault(require("./Document"));
class DocumentConfig extends Orm_1.BaseModel {
    static get fillable() {
        return [
            'cod',
            'typebooks_id',
            'companies_id',
            'box2',
            'prot',
            'month',
            'yeardoc',
            'documenttype_id',
            'free',
            'averb_anot',
            'book_name',
            'book_number',
            'sheet_number',
            'obs',
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
], DocumentConfig.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], DocumentConfig.prototype, "typebooks_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], DocumentConfig.prototype, "companies_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "prot", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "box2", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "month", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "yeardoc", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "documenttype_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "free", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "averb_anot", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "book_name", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "book_number", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "sheet_number", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "obs", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "intfield1", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "stringfield1", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "datefield1", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "intfield2", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "stringfield2", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "datefield2", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "intfield3", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "stringfield3", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "datefield3", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "intfield4", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "stringfield4", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "datefield4", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "intfield5", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "stringfield5", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "datefield5", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "intfield6", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "stringfield6", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "datefield6", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "intfield7", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "stringfield7", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "datefield7", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "intfield8", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "stringfield8", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "datefield8", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "intfield9", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "stringfield9", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "datefield9", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "intfield10", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "stringfield10", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "datefield10", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "intfield11", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "stringfield11", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "datefield11", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "intfield12", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "stringfield12", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "datefield12", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "intfield13", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "stringfield13", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DocumentConfig.prototype, "datefield13", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], DocumentConfig.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], DocumentConfig.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.hasOne)(() => Document_1.default),
    __metadata("design:type", Object)
], DocumentConfig.prototype, "document", void 0);
exports.default = DocumentConfig;
//# sourceMappingURL=DocumentConfig.js.map