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
const Orm_1 = global[Symbol.for('ioc.use')]("Adonis/Lucid/Orm");
class DriveDuplicateFolderScan extends Orm_1.BaseModel {
}
DriveDuplicateFolderScan.table = 'drive_duplicate_folder_scans';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], DriveDuplicateFolderScan.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], DriveDuplicateFolderScan.prototype, "status", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'run_token' }),
    __metadata("design:type", Object)
], DriveDuplicateFolderScan.prototype, "runToken", void 0);
__decorate([
    (0, Orm_1.column)({ prepare: (value) => value == null ? null : JSON.stringify(value), consume: (value) => typeof value === 'string' ? JSON.parse(value) : value }),
    __metadata("design:type", Object)
], DriveDuplicateFolderScan.prototype, "result", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'error_message' }),
    __metadata("design:type", Object)
], DriveDuplicateFolderScan.prototype, "errorMessage", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'started_at' }),
    __metadata("design:type", Object)
], DriveDuplicateFolderScan.prototype, "startedAt", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'finished_at' }),
    __metadata("design:type", Object)
], DriveDuplicateFolderScan.prototype, "finishedAt", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'heartbeat_at' }),
    __metadata("design:type", Object)
], DriveDuplicateFolderScan.prototype, "heartbeatAt", void 0);
exports.default = DriveDuplicateFolderScan;
//# sourceMappingURL=DriveDuplicateFolderScan.js.map