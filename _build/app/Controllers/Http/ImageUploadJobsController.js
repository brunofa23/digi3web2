"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const ImageUploadJob_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/ImageUploadJob"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
const imageUploadJobs_1 = global[Symbol.for('ioc.use')]("App/Services/imageUploadJobs");
class ImageUploadJobsController {
    constructor() {
        this.permissiongroupId = 45;
    }
    parseJson(value, fallback) {
        if (!value)
            return fallback;
        try {
            return JSON.parse(value);
        }
        catch (error) {
            return fallback;
        }
    }
    getSummary(job) {
        const resultFiles = this.parseJson(job.resultFiles, {});
        const summary = resultFiles?.summary || {};
        return {
            total: Number(summary.total || 0),
            uploaded: Number(summary.uploaded || 0),
            skipped: Number(summary.skipped || 0),
        };
    }
    getUploadStatus(job) {
        if (job.status === 'FAILED')
            return 'failed';
        if (job.status !== 'COMPLETED')
            return 'processing';
        const summary = this.getSummary(job);
        if (summary.uploaded > 0 && summary.skipped > 0)
            return 'partial';
        if (summary.uploaded > 0)
            return 'uploaded';
        if (summary.skipped > 0)
            return 'not_uploaded';
        return 'completed';
    }
    shouldShowJob(job) {
        const summary = this.getSummary(job);
        return !(job.status === 'COMPLETED' && summary.total === 0 && summary.uploaded === 0 && summary.skipped === 0);
    }
    getDateStart(dateStart) {
        const retentionStart = (0, imageUploadJobs_1.getUploadJobRetentionStart)();
        if (!dateStart)
            return retentionStart;
        const parsed = luxon_1.DateTime.fromISO(dateStart).startOf('day');
        if (!parsed.isValid || parsed < retentionStart)
            return retentionStart;
        return parsed;
    }
    async index({ auth, request, response }) {
        try {
            const authenticate = await auth.use('api').authenticate();
            const permissions = auth.use('api').token?.meta.payload.permissions || [];
            if (!(0, util_1.verifyPermission)(Boolean(authenticate.superuser), permissions, this.permissiongroupId)) {
                return response.status(403).send({
                    message: 'Usuário sem permissão para acessar histórico de uploads de imagens.',
                });
            }
            await (0, imageUploadJobs_1.cleanupOldImageUploadJobs)();
            const { companies_id, typebooks_id, user_id, dateStart, dateEnd, status, search, limit, } = request.only([
                'companies_id',
                'typebooks_id',
                'user_id',
                'dateStart',
                'dateEnd',
                'status',
                'search',
                'limit',
            ]);
            const maxLimit = Math.min(Number(limit) || 200, 500);
            const effectiveCompanyId = authenticate.superuser && companies_id
                ? companies_id
                : authenticate.companies_id;
            const start = this.getDateStart(dateStart);
            const end = dateEnd && luxon_1.DateTime.fromISO(dateEnd).isValid
                ? luxon_1.DateTime.fromISO(dateEnd).endOf('day')
                : luxon_1.DateTime.local().endOf('day');
            const query = ImageUploadJob_1.default.query()
                .where('companies_id', effectiveCompanyId)
                .andWhere('created_at', '>=', start.toFormat('yyyy-MM-dd HH:mm:ss'))
                .andWhere('created_at', '<=', end.toFormat('yyyy-MM-dd HH:mm:ss'))
                .orderBy('created_at', 'desc')
                .limit(Math.min(maxLimit * 3, 1000));
            if (typebooks_id)
                query.andWhere('typebooks_id', typebooks_id);
            if (user_id)
                query.andWhere('user_id', user_id);
            if (search) {
                query.andWhere((builder) => {
                    builder
                        .where('file_names', 'like', `%${search}%`)
                        .orWhere('result_files', 'like', `%${search}%`)
                        .orWhere('error_message', 'like', `%${search}%`);
                });
            }
            const jobs = await query;
            const visibleJobs = jobs.filter((job) => this.shouldShowJob(job));
            const filteredJobs = status
                ? visibleJobs.filter((job) => this.getUploadStatus(job) === status)
                : visibleJobs;
            const limitedJobs = filteredJobs.slice(0, maxLimit);
            const userIds = Array.from(new Set(limitedJobs.map((item) => item.userId).filter(Boolean)));
            const typebookIds = Array.from(new Set(limitedJobs.map((item) => item.typebooksId).filter(Boolean)));
            const users = userIds.length
                ? await User_1.default.query().whereIn('id', userIds).select('id', 'name', 'username')
                : [];
            const company = await Company_1.default.query().where('id', effectiveCompanyId).select('id', 'name', 'shortname').first();
            const typebooks = typebookIds.length
                ? await Typebook_1.default.query()
                    .where('companies_id', effectiveCompanyId)
                    .whereIn('id', typebookIds)
                    .select('id', 'name')
                : [];
            const usersById = new Map(users.map((user) => [user.id, user]));
            const typebooksById = new Map(typebooks.map((typebook) => [typebook.id, typebook]));
            return response.status(200).send({
                retentionDays: imageUploadJobs_1.RETENTION_DAYS,
                data: limitedJobs.map((job) => {
                    const resultFiles = this.parseJson(job.resultFiles, {});
                    const fileNames = this.parseJson(job.fileNames, []);
                    const dataImages = this.parseJson(job.dataImages, {});
                    return {
                        id: job.id,
                        companies_id: job.companiesId,
                        typebooks_id: job.typebooksId,
                        user_id: job.userId,
                        status: job.status,
                        upload_status: this.getUploadStatus(job),
                        source: job.source,
                        file_names: fileNames,
                        data_images: dataImages,
                        summary: this.getSummary(job),
                        uploaded_files: resultFiles?.uploadedFiles || [],
                        skipped_files: resultFiles?.skippedFiles || [],
                        error_message: job.errorMessage,
                        created_at: job.createdAt?.toISO(),
                        updated_at: job.updatedAt?.toISO(),
                        user: job.userId ? usersById.get(job.userId) : null,
                        company,
                        typebook: job.typebooksId ? typebooksById.get(job.typebooksId) : null,
                    };
                }),
            });
        }
        catch (error) {
            console.error('Erro ao consultar histórico de uploads de imagens:', error);
            return response.status(500).send({
                message: 'Erro ao consultar histórico de uploads de imagens.',
                error: error.message || String(error),
                code: error.code,
            });
        }
    }
}
exports.default = ImageUploadJobsController;
//# sourceMappingURL=ImageUploadJobsController.js.map