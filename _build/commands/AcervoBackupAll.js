"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const standalone_1 = require("@adonisjs/core/build/standalone");
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const luxon_1 = require("luxon");
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const url_1 = require("url");
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const AcervoBackupService_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/AcervoBackup/AcervoBackupService"));
class AcervoBackupAll extends standalone_1.BaseCommand {
    constructor() {
        super(...arguments);
        this.upload = false;
        this.retentionDays = 30;
        this.includeInactive = false;
        this.includeWithoutBooksModule = false;
        this.dryRun = false;
        this.shardTotal = 1;
        this.shardIndex = 1;
    }
    async run() {
        const retentionDays = Number(this.retentionDays || 30);
        const shardTotal = Number(this.shardTotal || 1);
        const shardIndex = Number(this.shardIndex || 1);
        if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) {
            this.logger.error('Informe retenção entre 1 e 3650 dias.');
            return;
        }
        if (!Number.isInteger(shardTotal) || shardTotal < 1 || shardTotal > 20) {
            this.logger.error('Informe shard-total entre 1 e 20.');
            return;
        }
        if (!Number.isInteger(shardIndex) || shardIndex < 1 || shardIndex > shardTotal) {
            this.logger.error('Informe shard-index entre 1 e o valor de shard-total.');
            return;
        }
        const allCompanies = await this.getCompanies();
        const companies = this.filterCompaniesByShard(allCompanies, shardTotal, shardIndex);
        if (companies.length === 0) {
            this.logger.warning('Nenhuma empresa encontrada para backup do acervo.');
            return;
        }
        const service = new AcervoBackupService_1.default();
        let success = 0;
        let errors = 0;
        const runId = this.getRunId(shardTotal, shardIndex);
        this.logger.info(shardTotal > 1
            ? `Empresas selecionadas: ${companies.length} de ${allCompanies.length} (parte ${shardIndex}/${shardTotal})`
            : `Empresas selecionadas: ${companies.length}`);
        if (this.dryRun) {
            for (const company of companies) {
                this.logger.info(`Empresa ${company.id} - ${company.name}`);
            }
            this.logger.warning('Dry-run executado. Nenhum backup foi gerado.');
            return;
        }
        await this.notifyBackupMonitor({
            run_id: runId,
            event: 'RUN_STARTED',
            expected_companies: companies.map((company) => ({
                companies_id: company.id,
                company_name: company.name,
            })),
            metadata: {
                upload: Boolean(this.upload),
                retention_days: retentionDays,
                shard_total: shardTotal,
                shard_index: shardIndex,
            },
        });
        const heartbeat = this.startBackupMonitorHeartbeat(runId);
        for (const company of companies) {
            try {
                this.logger.info(`Iniciando backup da empresa ${company.id} - ${company.name}`);
                await this.notifyBackupMonitor({
                    run_id: runId,
                    event: 'COMPANY_STARTED',
                    companies_id: company.id,
                    company_name: company.name,
                });
                const result = await service.backup({
                    companyId: company.id,
                    upload: Boolean(this.upload),
                    retentionDays,
                });
                success++;
                this.logger.success(`Empresa ${company.id}: snapshot=${result.snapshot} typebooks=${result.manifest.typebooks.length}`);
                await this.notifyBackupMonitor({
                    run_id: runId,
                    event: 'COMPANY_SUCCESS',
                    companies_id: company.id,
                    company_name: company.name,
                    metadata: {
                        snapshot: result.snapshot,
                        typebooks_count: result.manifest.typebooks.length,
                        total_rows: result.manifest.typebooks.reduce((total, typebook) => {
                            return total + (Number(typebook.total_rows) || 0);
                        }, 0),
                    },
                });
            }
            catch (error) {
                errors++;
                this.logger.error(`Empresa ${company.id}: ${error.message || error}`);
                await this.notifyBackupMonitor({
                    run_id: runId,
                    event: 'COMPANY_ERROR',
                    companies_id: company.id,
                    company_name: company.name,
                    error_message: error.message || String(error),
                });
            }
        }
        clearInterval(heartbeat);
        this.logger.info(`Resumo: sucesso=${success} erros=${errors}`);
        await this.notifyBackupMonitor({
            run_id: runId,
            event: errors > 0 ? 'RUN_ERROR' : 'RUN_SUCCESS',
            error_message: errors > 0 ? `Backup finalizado com ${errors} erro(s).` : null,
            metadata: {
                success,
                errors,
            },
        });
        if (errors > 0) {
            process.exitCode = 1;
        }
    }
    async getCompanies() {
        const query = Company_1.default.query().orderBy('id', 'asc');
        if (!this.includeInactive) {
            query.where('status', true);
        }
        if (!this.includeWithoutBooksModule) {
            query.where('module_books', true);
        }
        return query;
    }
    getRunId(shardTotal, shardIndex) {
        const base = luxon_1.DateTime.now().toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'");
        return shardTotal > 1
            ? `${base}_database_acervo_${shardIndex}_${shardTotal}`
            : `${base}_database_acervo`;
    }
    startBackupMonitorHeartbeat(runId) {
        const intervalSeconds = Math.max(Number(Env_1.default.get('BACKUP_MONITOR_HEARTBEAT_SECONDS', 300)), 60);
        const timer = setInterval(() => {
            this.notifyBackupMonitor({
                run_id: runId,
                event: 'HEARTBEAT',
            }).catch(() => null);
        }, intervalSeconds * 1000);
        timer.unref();
        return timer;
    }
    async notifyBackupMonitor(payload) {
        const webhookUrl = Env_1.default.get('BACKUP_MONITOR_WEBHOOK_URL', '');
        const secret = Env_1.default.get('BACKUP_WEBHOOK_SECRET', '');
        if (!webhookUrl || !secret)
            return;
        try {
            await this.postBackupMonitorEvent(webhookUrl, secret, {
                kind: 'DATABASE_ACERVO',
                ...payload,
            });
        }
        catch (error) {
            this.logger.warning(`Monitoramento do backup não enviado: ${error.message || error}`);
        }
    }
    postBackupMonitorEvent(webhookUrl, secret, payload) {
        const body = JSON.stringify(payload);
        const endpoint = new url_1.URL(webhookUrl);
        const transport = endpoint.protocol === 'https:' ? https : http;
        return new Promise((resolve, reject) => {
            const request = transport.request(endpoint, {
                method: 'POST',
                timeout: 10000,
                headers: {
                    'Authorization': `Bearer ${secret}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                },
            }, (response) => {
                response.resume();
                response.on('end', () => {
                    if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
                        resolve();
                        return;
                    }
                    reject(new Error(`HTTP ${response.statusCode}`));
                });
            });
            request.on('timeout', () => request.destroy(new Error('timeout')));
            request.on('error', reject);
            request.write(body);
            request.end();
        });
    }
    filterCompaniesByShard(companies, shardTotal, shardIndex) {
        if (shardTotal === 1)
            return companies;
        return companies.filter((_company, index) => {
            return index % shardTotal === shardIndex - 1;
        });
    }
}
AcervoBackupAll.commandName = 'acervo:backup-all';
AcervoBackupAll.description = 'Gera backup granular do acervo para todas as empresas ativas';
AcervoBackupAll.settings = {
    loadApp: true,
};
__decorate([
    standalone_1.flags.boolean({ description: 'Envia os arquivos gerados para o Google Drive das empresas' }),
    __metadata("design:type", Boolean)
], AcervoBackupAll.prototype, "upload", void 0);
__decorate([
    standalone_1.flags.number({ description: 'Dias de retenção dos snapshots' }),
    __metadata("design:type", Number)
], AcervoBackupAll.prototype, "retentionDays", void 0);
__decorate([
    standalone_1.flags.boolean({ description: 'Inclui empresas inativas' }),
    __metadata("design:type", Boolean)
], AcervoBackupAll.prototype, "includeInactive", void 0);
__decorate([
    standalone_1.flags.boolean({ description: 'Ignora filtro do módulo de livros' }),
    __metadata("design:type", Boolean)
], AcervoBackupAll.prototype, "includeWithoutBooksModule", void 0);
__decorate([
    standalone_1.flags.boolean({ description: 'Lista empresas selecionadas sem gerar backup' }),
    __metadata("design:type", Boolean)
], AcervoBackupAll.prototype, "dryRun", void 0);
__decorate([
    standalone_1.flags.number({ description: 'Quantidade total de partes para dividir o backup' }),
    __metadata("design:type", Number)
], AcervoBackupAll.prototype, "shardTotal", void 0);
__decorate([
    standalone_1.flags.number({ description: 'Parte atual do backup dividido, iniciando em 1' }),
    __metadata("design:type", Number)
], AcervoBackupAll.prototype, "shardIndex", void 0);
exports.default = AcervoBackupAll;
//# sourceMappingURL=AcervoBackupAll.js.map