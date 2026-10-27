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
const jsonColumn = {
    prepare: (value) => value === null ? null : JSON.stringify(value),
    consume: (value) => typeof value === 'string' ? JSON.parse(value) : value,
};
class IndeximageSideModel extends Orm_1.BaseModel {
}
IndeximageSideModel.table = 'indeximage_side_models';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], IndeximageSideModel.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], IndeximageSideModel.prototype, "companies_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], IndeximageSideModel.prototype, "typebooks_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], IndeximageSideModel.prototype, "book", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], IndeximageSideModel.prototype, "version", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], IndeximageSideModel.prototype, "status", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], IndeximageSideModel.prototype, "phase", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], IndeximageSideModel.prototype, "processed", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], IndeximageSideModel.prototype, "total", void 0);
__decorate([
    (0, Orm_1.column)(jsonColumn),
    __metadata("design:type", Array)
], IndeximageSideModel.prototype, "training_samples", void 0);
__decorate([
    (0, Orm_1.column)(jsonColumn),
    __metadata("design:type", Array)
], IndeximageSideModel.prototype, "validation_label_ids", void 0);
__decorate([
    (0, Orm_1.column)({ ...jsonColumn, serializeAs: null }),
    __metadata("design:type", Object)
], IndeximageSideModel.prototype, "model_data", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], IndeximageSideModel.prototype, "requested_by", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], IndeximageSideModel.prototype, "active_slot", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], IndeximageSideModel.prototype, "error_message", void 0);
__decorate([
    (0, Orm_1.column)({ serializeAs: null }),
    __metadata("design:type", Object)
], IndeximageSideModel.prototype, "lease_token", void 0);
__decorate([
    Orm_1.column.dateTime({ serializeAs: null }),
    __metadata("design:type", Object)
], IndeximageSideModel.prototype, "lease_expires_at", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", Object)
], IndeximageSideModel.prototype, "started_at", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", Object)
], IndeximageSideModel.prototype, "finished_at", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], IndeximageSideModel.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], IndeximageSideModel.prototype, "updatedAt", void 0);
exports.default = IndeximageSideModel;
//# sourceMappingURL=IndeximageSideModel.js.map