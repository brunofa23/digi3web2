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
const DriveDeletionItem_1 = __importDefault(require("./DriveDeletionItem"));
class DriveDeletionBatch extends Orm_1.BaseModel {
}
DriveDeletionBatch.table = 'drive_deletion_batches';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], DriveDeletionBatch.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'companies_id' }),
    __metadata("design:type", Number)
], DriveDeletionBatch.prototype, "companiesId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'typebooks_id' }),
    __metadata("design:type", Number)
], DriveDeletionBatch.prototype, "typebooksId", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'user_id' }),
    __metadata("design:type", Object)
], DriveDeletionBatch.prototype, "userId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DriveDeletionBatch.prototype, "action", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DriveDeletionBatch.prototype, "status", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], DriveDeletionBatch.prototype, "book", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'start_cod' }),
    __metadata("design:type", Number)
], DriveDeletionBatch.prototype, "startCod", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'end_cod' }),
    __metadata("design:type", Number)
], DriveDeletionBatch.prototype, "endCod", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'total_items' }),
    __metadata("design:type", Number)
], DriveDeletionBatch.prototype, "totalItems", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'processed_items' }),
    __metadata("design:type", Number)
], DriveDeletionBatch.prototype, "processedItems", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'failed_items' }),
    __metadata("design:type", Number)
], DriveDeletionBatch.prototype, "failedItems", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'last_error' }),
    __metadata("design:type", Object)
], DriveDeletionBatch.prototype, "lastError", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'started_at' }),
    __metadata("design:type", Object)
], DriveDeletionBatch.prototype, "startedAt", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'finished_at' }),
    __metadata("design:type", Object)
], DriveDeletionBatch.prototype, "finishedAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, columnName: 'created_at' }),
    __metadata("design:type", luxon_1.DateTime)
], DriveDeletionBatch.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' }),
    __metadata("design:type", luxon_1.DateTime)
], DriveDeletionBatch.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.hasMany)(() => DriveDeletionItem_1.default, { foreignKey: 'batchId' }),
    __metadata("design:type", Object)
], DriveDeletionBatch.prototype, "items", void 0);
exports.default = DriveDeletionBatch;
//# sourceMappingURL=DriveDeletionBatch.js.map