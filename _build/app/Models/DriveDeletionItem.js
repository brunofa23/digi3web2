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
const DriveDeletionBatch_1 = __importDefault(require("./DriveDeletionBatch"));
class DriveDeletionItem extends Orm_1.BaseModel {
}
DriveDeletionItem.table = 'drive_deletion_items';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], DriveDeletionItem.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'batch_id' }),
    __metadata("design:type", Number)
], DriveDeletionItem.prototype, "batchId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'companies_id' }),
    __metadata("design:type", Number)
], DriveDeletionItem.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'typebooks_id' }),
    __metadata("design:type", Number)
], DriveDeletionItem.prototype, "typebooksId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'bookrecords_id' }),
    __metadata("design:type", Number)
], DriveDeletionItem.prototype, "bookrecordsId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], DriveDeletionItem.prototype, "seq", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'drive_file_id' }),
    __metadata("design:type", Object)
], DriveDeletionItem.prototype, "driveFileId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'file_name' }),
    __metadata("design:type", Object)
], DriveDeletionItem.prototype, "fileName", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DriveDeletionItem.prototype, "status", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], DriveDeletionItem.prototype, "attempts", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'last_error' }),
    __metadata("design:type", Object)
], DriveDeletionItem.prototype, "lastError", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'processed_at' }),
    __metadata("design:type", Object)
], DriveDeletionItem.prototype, "processedAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, columnName: 'created_at' }),
    __metadata("design:type", luxon_1.DateTime)
], DriveDeletionItem.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' }),
    __metadata("design:type", luxon_1.DateTime)
], DriveDeletionItem.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.belongsTo)(() => DriveDeletionBatch_1.default, { foreignKey: 'batchId' }),
    __metadata("design:type", Object)
], DriveDeletionItem.prototype, "batch", void 0);
exports.default = DriveDeletionItem;
//# sourceMappingURL=DriveDeletionItem.js.map