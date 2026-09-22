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
class AcervoSnapshots extends standalone_1.BaseCommand {
    constructor() {
        super(...arguments);
        this.source = 'local';
    }
    async run() {
        const companyId = Number(this.company);
        const typebookId = Number(this.typebook);
        const source = String(this.source || 'local');
        if (!Number.isInteger(companyId) || companyId <= 0) {
            this.logger.error('Informe uma empresa válida. Exemplo: node ace acervo:snapshots --company=10');
            return;
        }
        if (this.typebook !== undefined && (!Number.isInteger(typebookId) || typebookId <= 0)) {
            this.logger.error('Informe um typebook válido. Exemplo: node ace acervo:snapshots --company=10 --typebook=236');
            return;
        }
        if (!['local', 'drive'].includes(source)) {
            this.logger.error('Origem inválida. Use --source=local ou --source=drive.');
            return;
        }
        const service = new AcervoBackupService_1.default();
        const snapshots = await service.listSnapshots({
            companyId,
            typebookId: Number.isInteger(typebookId) && typebookId > 0 ? typebookId : undefined,
            source: source,
        });
        if (snapshots.length === 0) {
            this.logger.warning('Nenhum snapshot encontrado.');
            return;
        }
        for (const snapshot of snapshots) {
            this.logger.info(`Snapshot: ${snapshot.snapshot} (${snapshot.source})`);
            for (const typebook of snapshot.typebooks) {
                this.logger.info(`  typebook=${typebook.typebooks_id} ${typebook.typebook_name} registros=${typebook.total_rows} arquivo=${typebook.file}`);
            }
        }
    }
}
AcervoSnapshots.commandName = 'acervo:snapshots';
AcervoSnapshots.description = 'Lista snapshots de backup do acervo por empresa e typebook';
AcervoSnapshots.settings = {
    loadApp: true,
};
__decorate([
    standalone_1.flags.number({ description: 'ID da empresa' }),
    __metadata("design:type", Number)
], AcervoSnapshots.prototype, "company", void 0);
__decorate([
    standalone_1.flags.number({ description: 'ID do typebook. Se omitido, lista todos' }),
    __metadata("design:type", Number)
], AcervoSnapshots.prototype, "typebook", void 0);
__decorate([
    standalone_1.flags.string({ description: 'Origem dos backups: local ou drive' }),
    __metadata("design:type", String)
], AcervoSnapshots.prototype, "source", void 0);
exports.default = AcervoSnapshots;
//# sourceMappingURL=AcervoSnapshots.js.map