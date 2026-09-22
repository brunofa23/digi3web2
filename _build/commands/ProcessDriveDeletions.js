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
const standalone_1 = require("@adonisjs/core/build/standalone");
const DriveDeletionQueueService_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/DriveDeletionQueueService"));
class ProcessDriveDeletions extends standalone_1.BaseCommand {
    constructor() {
        super(...arguments);
        this.limit = 20;
    }
    async run() {
        const limit = Number(this.limit || 20);
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            this.logger.error('Informe um limite entre 1 e 100.');
            return;
        }
        const result = await DriveDeletionQueueService_1.default.processPending(limit);
        this.logger.info(`Fila processada: ${result.batches} lote(s), ${result.processed} item(ns), ${result.failed} falha(s).`);
    }
}
ProcessDriveDeletions.commandName = 'drive:process-deletions';
ProcessDriveDeletions.description = 'Processa a fila segura de exclusão de imagens do Google Drive';
ProcessDriveDeletions.settings = { loadApp: true };
__decorate([
    standalone_1.flags.number({ description: 'Quantidade máxima de lotes por execução' }),
    __metadata("design:type", Number)
], ProcessDriveDeletions.prototype, "limit", void 0);
exports.default = ProcessDriveDeletions;
//# sourceMappingURL=ProcessDriveDeletions.js.map