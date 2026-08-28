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
class AcervoRestore extends standalone_1.BaseCommand {
    constructor() {
        super(...arguments);
        this.source = 'local';
        this.dryRun = false;
        this.confirm = false;
    }
    async run() {
        const companyId = Number(this.company);
        const typebookId = Number(this.typebook);
        const source = String(this.source || 'local');
        if (!Number.isInteger(companyId) || companyId <= 0) {
            this.logger.error('Informe uma empresa válida. Exemplo: node ace acervo:restore --company=15 --typebook=236 --snapshot=2026-08-28_0600 --dry-run');
            return;
        }
        if (!Number.isInteger(typebookId) || typebookId <= 0) {
            this.logger.error('Informe um typebook válido. Exemplo: node ace acervo:restore --company=15 --typebook=236 --snapshot=2026-08-28_0600 --dry-run');
            return;
        }
        if (!this.snapshot) {
            this.logger.error('Informe o snapshot. Exemplo: --snapshot=2026-08-28_0600');
            return;
        }
        if (!['local', 'drive'].includes(source)) {
            this.logger.error('Origem inválida. Use --source=local ou --source=drive.');
            return;
        }
        if (!this.dryRun && !this.confirm) {
            this.logger.error('Por segurança, execute primeiro com --dry-run ou confirme com --confirm.');
            return;
        }
        if (this.confirm && !String(this.reason || '').trim()) {
            this.logger.error('Informe o motivo da restauração com --reason="..."');
            return;
        }
        const service = new AcervoBackupService_1.default();
        const result = await service.restore({
            companyId,
            typebookId,
            snapshot: this.snapshot,
            source: source,
            dryRun: Boolean(this.dryRun),
            confirm: Boolean(this.confirm),
            reason: String(this.reason || '').trim(),
        });
        this.logger.success(this.dryRun ? 'Backup validado com sucesso.' : 'Acervo restaurado com sucesso.');
        this.logger.info(`Snapshot: ${result.snapshot}`);
        this.logger.info(`Origem: ${result.source}`);
        this.logger.info(`Typebook: ${result.typebook.typebooks_id} - ${result.typebook.typebook_name}`);
        this.logger.info(`Arquivo: ${result.typebook.file}`);
        this.logger.info(`Checksum: ${result.checksum}`);
        for (const [table, total] of Object.entries(result.typebook.tables || {})) {
            this.logger.info(`${table}: ${total}`);
        }
        for (const warning of result.warnings || []) {
            this.logger.warning(warning);
        }
        if (!this.dryRun) {
            this.logger.warning(`Pre-restore gerado em: ${result.pre_restore_path}`);
        }
    }
}
AcervoRestore.commandName = 'acervo:restore';
AcervoRestore.description = 'Restaura backup granular do acervo por empresa e typebook';
AcervoRestore.settings = {
    loadApp: true,
};
__decorate([
    standalone_1.flags.number({ description: 'ID da empresa' }),
    __metadata("design:type", Number)
], AcervoRestore.prototype, "company", void 0);
__decorate([
    standalone_1.flags.number({ description: 'ID do typebook que será restaurado' }),
    __metadata("design:type", Number)
], AcervoRestore.prototype, "typebook", void 0);
__decorate([
    standalone_1.flags.string({ description: 'Snapshot no formato yyyy-MM-dd_HHmm' }),
    __metadata("design:type", String)
], AcervoRestore.prototype, "snapshot", void 0);
__decorate([
    standalone_1.flags.string({ description: 'Origem do backup: local ou drive' }),
    __metadata("design:type", String)
], AcervoRestore.prototype, "source", void 0);
__decorate([
    standalone_1.flags.boolean({ description: 'Valida manifest/checksum sem aplicar restauração' }),
    __metadata("design:type", Boolean)
], AcervoRestore.prototype, "dryRun", void 0);
__decorate([
    standalone_1.flags.boolean({ description: 'Confirma a aplicação da restauração no banco' }),
    __metadata("design:type", Boolean)
], AcervoRestore.prototype, "confirm", void 0);
__decorate([
    standalone_1.flags.string({ description: 'Motivo da restauração' }),
    __metadata("design:type", String)
], AcervoRestore.prototype, "reason", void 0);
exports.default = AcervoRestore;
//# sourceMappingURL=AcervoRestore.js.map