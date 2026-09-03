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
const BackupCompanyStatus_1 = __importDefault(require("./BackupCompanyStatus"));
function parseJson(value) {
    if (!value)
        return null;
    if (typeof value === 'string')
        return JSON.parse(value);
    return value;
}
class BackupRun extends Orm_1.BaseModel {
}
BackupRun.table = 'backup_runs';
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], BackupRun.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'run_id' }),
    __metadata("design:type", String)
], BackupRun.prototype, "runId", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], BackupRun.prototype, "kind", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], BackupRun.prototype, "status", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'expected_companies' }),
    __metadata("design:type", Number)
], BackupRun.prototype, "expectedCompanies", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'success_companies' }),
    __metadata("design:type", Number)
], BackupRun.prototype, "successCompanies", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'error_companies' }),
    __metadata("design:type", Number)
], BackupRun.prototype, "errorCompanies", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'pending_companies' }),
    __metadata("design:type", Number)
], BackupRun.prototype, "pendingCompanies", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'started_at' }),
    __metadata("design:type", Object)
], BackupRun.prototype, "startedAt", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'finished_at' }),
    __metadata("design:type", Object)
], BackupRun.prototype, "finishedAt", void 0);
__decorate([
    Orm_1.column.dateTime({ columnName: 'last_heartbeat_at' }),
    __metadata("design:type", Object)
], BackupRun.prototype, "lastHeartbeatAt", void 0);
__decorate([
    (0, Orm_1.column)({ columnName: 'error_message' }),
    __metadata("design:type", Object)
], BackupRun.prototype, "errorMessage", void 0);
__decorate([
    (0, Orm_1.column)({
        prepare: (value) => value === undefined ? null : JSON.stringify(value),
        consume: parseJson,
    }),
    __metadata("design:type", Object)
], BackupRun.prototype, "metadata", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, columnName: 'created_at' }),
    __metadata("design:type", luxon_1.DateTime)
], BackupRun.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' }),
    __metadata("design:type", luxon_1.DateTime)
], BackupRun.prototype, "updatedAt", void 0);
__decorate([
    (0, Orm_1.hasMany)(() => BackupCompanyStatus_1.default, {
        foreignKey: 'backupRunId',
    }),
    __metadata("design:type", Object)
], BackupRun.prototype, "companies", void 0);
exports.default = BackupRun;
//# sourceMappingURL=BackupRun.js.map