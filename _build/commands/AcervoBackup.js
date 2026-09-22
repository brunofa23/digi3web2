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
const AcervoBackupService_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/AcervoBackup/AcervoBackupService"));
class AcervoBackup extends standalone_1.BaseCommand {
    constructor() {
        super(...arguments);
        this.upload = false;
        this.retentionDays = 30;
    }
    async run() {
        const companyId = Number(this.company);
        const typebookId = Number(this.typebook);
        const retentionDays = Number(this.retentionDays || 30);
        if (!Number.isInteger(companyId) || companyId <= 0) {
            this.logger.error('Informe uma empresa válida. Exemplo: node ace acervo:backup --company=15');
            return;
        }
        if (this.typebook !== undefined && (!Number.isInteger(typebookId) || typebookId <= 0)) {
            this.logger.error('Informe um typebook válido. Exemplo: node ace acervo:backup --company=15 --typebook=236');
            return;
        }
        if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) {
            this.logger.error('Informe retenção entre 1 e 3650 dias.');
            return;
        }
        const service = new AcervoBackupService_1.default();
        const result = await service.backup({
            companyId,
            typebookId: Number.isInteger(typebookId) && typebookId > 0 ? typebookId : undefined,
            upload: Boolean(this.upload),
            retentionDays,
        });
        this.logger.success(`Snapshot gerado: ${result.snapshot}`);
        this.logger.info(`Pasta local: ${result.path}`);
        this.logger.info(`Typebooks: ${result.manifest.typebooks.length}`);
        for (const item of result.manifest.typebooks) {
            this.logger.info(`typebook=${item.typebooks_id} arquivo=${item.file} registros=${item.total_rows} checksum=${item.checksum_sha256}`);
        }
        if (!this.upload) {
            this.logger.warning('Upload não executado. Use --upload para enviar ao Google Drive.');
        }
    }
}
AcervoBackup.commandName = 'acervo:backup';
AcervoBackup.description = 'Gera backup granular do acervo por empresa e typebook';
AcervoBackup.settings = {
    loadApp: true,
};
__decorate([
    standalone_1.flags.number({ description: 'ID da empresa' }),
    __metadata("design:type", Number)
], AcervoBackup.prototype, "company", void 0);
__decorate([
    standalone_1.flags.number({ description: 'ID do typebook. Se omitido, gera todos os typebooks da empresa' }),
    __metadata("design:type", Number)
], AcervoBackup.prototype, "typebook", void 0);
__decorate([
    standalone_1.flags.boolean({ description: 'Envia os arquivos gerados para o Google Drive da empresa' }),
    __metadata("design:type", Boolean)
], AcervoBackup.prototype, "upload", void 0);
__decorate([
    standalone_1.flags.number({ description: 'Dias de retenção dos snapshots' }),
    __metadata("design:type", Number)
], AcervoBackup.prototype, "retentionDays", void 0);
exports.default = AcervoBackup;
//# sourceMappingURL=AcervoBackup.js.map