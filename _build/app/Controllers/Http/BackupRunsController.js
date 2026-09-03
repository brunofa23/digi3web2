"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const luxon_1 = require("luxon");
const crypto_1 = require("crypto");
const BackupRun_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/BackupRun"));
const BackupCompanyStatus_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/BackupCompanyStatus"));
class BackupRunsController {
    constructor() {
        this.kind = 'DATABASE_ACERVO';
    }
    getNow() {
        return luxon_1.DateTime.now();
    }
    secureEquals(value, expected) {
        const valueBuffer = Buffer.from(value);
        const expectedBuffer = Buffer.from(expected);
        if (valueBuffer.length !== expectedBuffer.length)
            return false;
        return (0, crypto_1.timingSafeEqual)(valueBuffer, expectedBuffer);
    }
    verifyWebhook({ request, response }) {
        const secret = Env_1.default.get('BACKUP_WEBHOOK_SECRET', '');
        if (!secret) {
            response.status(503).send({ message: 'Webhook de backup não configurado.' });
            return false;
        }
        const authorization = request.header('authorization') || '';
        const token = authorization.startsWith('Bearer ')
            ? authorization.substring(7)
            : request.header('x-backup-webhook-secret') || '';
        if (!token || !this.secureEquals(token, secret)) {
            response.status(401).send({ message: 'Webhook de backup não autorizado.' });
            return false;
        }
        return true;
    }
    async authorize({ auth, response }) {
        const user = await auth.use('api').authenticate();
        if (!user.superuser) {
            response.status(403).send({
                message: 'Usuário sem permissão para consultar backups.',
            });
            return null;
        }
        return user;
    }
    getRunId(value) {
        const runId = String(value || '').trim();
        return runId.length > 0 && runId.length <= 80 ? runId : null;
    }
    getEvent(value) {
        const event = String(value || '').trim().toUpperCase();
        const allowedEvents = [
            'RUN_STARTED',
            'HEARTBEAT',
            'COMPANY_STARTED',
            'COMPANY_SUCCESS',
            'COMPANY_ERROR',
            'RUN_SUCCESS',
            'RUN_ERROR',
        ];
        return allowedEvents.includes(event) ? event : null;
    }
    normalizeCompanies(value) {
        if (!Array.isArray(value))
            return [];
        return value
            .map((item) => {
            const companiesId = Number(typeof item === 'object' ? item.companies_id : item);
            const companyName = typeof item === 'object' ? String(item.company_name || '').trim() : '';
            return {
                companies_id: Number.isInteger(companiesId) && companiesId > 0 ? companiesId : 0,
                company_name: companyName || null,
            };
        })
            .filter((item) => item.companies_id > 0);
    }
    async findOrCreateRun(runId) {
        const existing = await BackupRun_1.default.query()
            .where('run_id', runId)
            .andWhere('kind', this.kind)
            .first();
        if (existing)
            return existing;
        return BackupRun_1.default.create({
            runId,
            kind: this.kind,
            status: 'RUNNING',
            startedAt: this.getNow(),
            lastHeartbeatAt: this.getNow(),
            expectedCompanies: 0,
            successCompanies: 0,
            errorCompanies: 0,
            pendingCompanies: 0,
        });
    }
    async syncExpectedCompanies(run, companies) {
        for (const company of companies) {
            const item = await BackupCompanyStatus_1.default.query()
                .where('backup_run_id', run.id)
                .andWhere('companies_id', company.companies_id)
                .first();
            if (item) {
                if (company.company_name && item.companyName !== company.company_name) {
                    item.companyName = company.company_name;
                    await item.save();
                }
                continue;
            }
            await BackupCompanyStatus_1.default.create({
                backupRunId: run.id,
                companiesId: company.companies_id,
                companyName: company.company_name || null,
                status: 'PENDING',
            });
        }
    }
    async findOrCreateCompanyStatus(run, companiesId, companyName) {
        const item = await BackupCompanyStatus_1.default.query()
            .where('backup_run_id', run.id)
            .andWhere('companies_id', companiesId)
            .first();
        if (item)
            return item;
        return BackupCompanyStatus_1.default.create({
            backupRunId: run.id,
            companiesId,
            companyName: companyName || null,
            status: 'PENDING',
        });
    }
    async updateCompanyStatus(run, payload, status) {
        const companiesId = Number(payload.companies_id);
        if (!Number.isInteger(companiesId) || companiesId <= 0) {
            throw new Error('Empresa obrigatória para evento de empresa.');
        }
        const item = await this.findOrCreateCompanyStatus(run, companiesId, String(payload.company_name || '').trim());
        const now = this.getNow();
        item.status = status;
        item.companyName = String(payload.company_name || item.companyName || '').trim() || null;
        item.errorMessage = status === 'ERROR' ? String(payload.error_message || '').slice(0, 5000) : null;
        item.metadata = payload.metadata || item.metadata || null;
        if (!item.startedAt || status === 'RUNNING') {
            item.startedAt = now;
        }
        if (['SUCCESS', 'ERROR'].includes(status)) {
            item.finishedAt = now;
        }
        await item.save();
    }
    async updateCounters(run) {
        const companies = await BackupCompanyStatus_1.default.query().where('backup_run_id', run.id);
        const success = companies.filter((company) => company.status === 'SUCCESS').length;
        const error = companies.filter((company) => company.status === 'ERROR').length;
        const pending = companies.filter((company) => ['PENDING', 'RUNNING'].includes(company.status)).length;
        run.expectedCompanies = companies.length;
        run.successCompanies = success;
        run.errorCompanies = error;
        run.pendingCompanies = pending;
        await run.save();
    }
    getEffectiveStatus(run) {
        if (run.status !== 'RUNNING')
            return run.status;
        if (!run.lastHeartbeatAt)
            return 'NOT_RUNNING';
        const timeoutMinutes = Number(Env_1.default.get('BACKUP_HEARTBEAT_TIMEOUT_MINUTES', 30));
        const minutesSinceHeartbeat = this.getNow().diff(run.lastHeartbeatAt, 'minutes').minutes;
        return minutesSinceHeartbeat > timeoutMinutes ? 'NOT_RUNNING' : 'RUNNING';
    }
    serializeCompany(company) {
        return {
            id: company.id,
            companies_id: company.companiesId,
            company_name: company.companyName,
            status: company.status,
            started_at: company.startedAt?.toISO() || null,
            finished_at: company.finishedAt?.toISO() || null,
            error_message: company.errorMessage,
            metadata: company.metadata,
        };
    }
    serializeRun(run) {
        const companies = run.companies || [];
        return {
            id: run.id,
            run_id: run.runId,
            kind: run.kind,
            status: this.getEffectiveStatus(run),
            stored_status: run.status,
            expected_companies: run.expectedCompanies,
            success_companies: run.successCompanies,
            error_companies: run.errorCompanies,
            pending_companies: run.pendingCompanies,
            started_at: run.startedAt?.toISO() || null,
            finished_at: run.finishedAt?.toISO() || null,
            last_heartbeat_at: run.lastHeartbeatAt?.toISO() || null,
            error_message: run.errorMessage,
            metadata: run.metadata,
            companies: {
                success: companies.filter((company) => company.status === 'SUCCESS').map((company) => this.serializeCompany(company)),
                error: companies.filter((company) => company.status === 'ERROR').map((company) => this.serializeCompany(company)),
                pending: companies.filter((company) => company.status === 'PENDING').map((company) => this.serializeCompany(company)),
                running: companies.filter((company) => company.status === 'RUNNING').map((company) => this.serializeCompany(company)),
            },
            created_at: run.createdAt?.toISO() || null,
            updated_at: run.updatedAt?.toISO() || null,
        };
    }
    async event(ctx) {
        try {
            if (!this.verifyWebhook(ctx))
                return;
            const payload = ctx.request.body();
            const runId = this.getRunId(payload?.run_id);
            const event = this.getEvent(payload?.event);
            if (!runId) {
                return ctx.response.status(400).send({ message: 'run_id obrigatório.' });
            }
            if (!event) {
                return ctx.response.status(400).send({ message: 'Evento de backup inválido.' });
            }
            const run = await this.findOrCreateRun(runId);
            const now = this.getNow();
            run.lastHeartbeatAt = now;
            if (event === 'RUN_STARTED') {
                run.status = 'RUNNING';
                run.startedAt = run.startedAt || now;
                run.finishedAt = null;
                run.errorMessage = null;
                run.metadata = payload.metadata || run.metadata || null;
                await run.save();
                await this.syncExpectedCompanies(run, this.normalizeCompanies(payload.expected_companies));
            }
            if (event === 'HEARTBEAT') {
                await run.save();
            }
            if (event === 'COMPANY_STARTED') {
                await this.updateCompanyStatus(run, payload, 'RUNNING');
            }
            if (event === 'COMPANY_SUCCESS') {
                await this.updateCompanyStatus(run, payload, 'SUCCESS');
            }
            if (event === 'COMPANY_ERROR') {
                await this.updateCompanyStatus(run, payload, 'ERROR');
            }
            if (event === 'RUN_SUCCESS') {
                run.finishedAt = now;
                run.errorMessage = null;
            }
            if (event === 'RUN_ERROR') {
                run.status = 'ERROR';
                run.finishedAt = now;
                run.errorMessage = String(payload.error_message || 'Backup finalizado com erro.').slice(0, 5000);
            }
            await this.updateCounters(run);
            if (event === 'RUN_SUCCESS') {
                run.status = run.errorCompanies === 0 && run.pendingCompanies === 0 ? 'SUCCESS' : 'ERROR';
                run.errorMessage = run.status === 'SUCCESS' ? null : 'Backup finalizado com empresas pendentes ou com erro.';
                await run.save();
            }
            return ctx.response.status(200).send({
                ok: true,
                run_id: run.runId,
                status: run.status,
            });
        }
        catch (error) {
            console.error('Erro ao receber evento de backup:', error);
            return ctx.response.status(500).send({
                message: 'Erro ao receber evento de backup.',
                error: error.message || String(error),
            });
        }
    }
    async latestDatabase(ctx) {
        try {
            const user = await this.authorize(ctx);
            if (!user)
                return;
            const run = await BackupRun_1.default.query()
                .where('kind', this.kind)
                .orderBy('started_at', 'desc')
                .preload('companies', (query) => query.orderBy('company_name', 'asc'))
                .first();
            return ctx.response.status(200).send({
                data: run ? this.serializeRun(run) : null,
            });
        }
        catch (error) {
            console.error('Erro ao consultar último backup do banco:', error);
            return ctx.response.status(500).send({
                message: 'Erro ao consultar último backup do banco.',
                error: error.message || String(error),
            });
        }
    }
}
exports.default = BackupRunsController;
//# sourceMappingURL=BackupRunsController.js.map