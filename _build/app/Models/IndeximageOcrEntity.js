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
class IndeximageOcrEntity extends Orm_1.BaseModel {
}
IndeximageOcrEntity.table = 'indeximage_ocr_entities';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], IndeximageOcrEntity.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], IndeximageOcrEntity.prototype, "companies_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], IndeximageOcrEntity.prototype, "typebooks_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], IndeximageOcrEntity.prototype, "bookrecords_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], IndeximageOcrEntity.prototype, "seq", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], IndeximageOcrEntity.prototype, "entity_type", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], IndeximageOcrEntity.prototype, "value", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], IndeximageOcrEntity.prototype, "normalized_value", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], IndeximageOcrEntity.prototype, "confidence", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], IndeximageOcrEntity.prototype, "source", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], IndeximageOcrEntity.prototype, "evidence_text", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], IndeximageOcrEntity.prototype, "position_json", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], IndeximageOcrEntity.prototype, "review_status", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], IndeximageOcrEntity.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], IndeximageOcrEntity.prototype, "updatedAt", void 0);
exports.default = IndeximageOcrEntity;
//# sourceMappingURL=IndeximageOcrEntity.js.map