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
class IndeximageOcrCheck extends Orm_1.BaseModel {
}
IndeximageOcrCheck.table = 'indeximage_ocr_checks';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], IndeximageOcrCheck.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], IndeximageOcrCheck.prototype, "companies_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], IndeximageOcrCheck.prototype, "typebooks_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], IndeximageOcrCheck.prototype, "bookrecords_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], IndeximageOcrCheck.prototype, "seq", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], IndeximageOcrCheck.prototype, "layout_profile", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], IndeximageOcrCheck.prototype, "expected_sheet", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], IndeximageOcrCheck.prototype, "detected_sheet", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], IndeximageOcrCheck.prototype, "expected_term", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], IndeximageOcrCheck.prototype, "detected_term", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], IndeximageOcrCheck.prototype, "sheet_status", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], IndeximageOcrCheck.prototype, "term_status", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], IndeximageOcrCheck.prototype, "confidence", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], IndeximageOcrCheck.prototype, "confidence_level", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], IndeximageOcrCheck.prototype, "evidence_text", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], IndeximageOcrCheck.prototype, "source", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], IndeximageOcrCheck.prototype, "auto_applied", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], IndeximageOcrCheck.prototype, "review_status", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", Object)
], IndeximageOcrCheck.prototype, "processed_at", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], IndeximageOcrCheck.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], IndeximageOcrCheck.prototype, "updatedAt", void 0);
exports.default = IndeximageOcrCheck;
//# sourceMappingURL=IndeximageOcrCheck.js.map