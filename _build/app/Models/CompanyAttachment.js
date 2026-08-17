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
const Company_1 = __importDefault(require("./Company"));
class CompanyAttachment extends Orm_1.BaseModel {
    static get table() {
        return 'company_attachments';
    }
}
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], CompanyAttachment.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'companies_id' }),
    __metadata("design:type", Number)
], CompanyAttachment.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], CompanyAttachment.prototype, "description", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'original_name' }),
    __metadata("design:type", String)
], CompanyAttachment.prototype, "originalName", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'file_name' }),
    __metadata("design:type", String)
], CompanyAttachment.prototype, "fileName", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'mime_type' }),
    __metadata("design:type", Object)
], CompanyAttachment.prototype, "mimeType", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], CompanyAttachment.prototype, "extension", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Object)
], CompanyAttachment.prototype, "size", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'drive_file_id' }),
    __metadata("design:type", String)
], CompanyAttachment.prototype, "driveFileId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'drive_folder_id' }),
    __metadata("design:type", String)
], CompanyAttachment.prototype, "driveFolderId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'uploaded_by' }),
    __metadata("design:type", Object)
], CompanyAttachment.prototype, "uploadedBy", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'deleted_at' }),
    __metadata("design:type", Object)
], CompanyAttachment.prototype, "deletedAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], CompanyAttachment.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], CompanyAttachment.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => Company_1.default, {
        foreignKey: 'companiesId',
    }),
    __metadata("design:type", Object)
], CompanyAttachment.prototype, "company", void 0);
exports.default = CompanyAttachment;
//# sourceMappingURL=CompanyAttachment.js.map