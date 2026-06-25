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
class ImageUploadJob extends Orm_1.BaseModel {
}
ImageUploadJob.table = 'image_upload_jobs';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], ImageUploadJob.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'companies_id' }),
    __metadata("design:type", Number)
], ImageUploadJob.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'typebooks_id' }),
    __metadata("design:type", Object)
], ImageUploadJob.prototype, "typebooksId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], ImageUploadJob.prototype, "status", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], ImageUploadJob.prototype, "source", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'file_names' }),
    __metadata("design:type", Object)
], ImageUploadJob.prototype, "fileNames", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'data_images' }),
    __metadata("design:type", Object)
], ImageUploadJob.prototype, "dataImages", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'result_files' }),
    __metadata("design:type", Object)
], ImageUploadJob.prototype, "resultFiles", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'error_message' }),
    __metadata("design:type", Object)
], ImageUploadJob.prototype, "errorMessage", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, columnName: 'created_at' }),
    __metadata("design:type", luxon_1.DateTime)
], ImageUploadJob.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' }),
    __metadata("design:type", luxon_1.DateTime)
], ImageUploadJob.prototype, "updatedAt", void 0);
exports.default = ImageUploadJob;
//# sourceMappingURL=ImageUploadJob.js.map