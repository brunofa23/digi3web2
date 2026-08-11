"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const AuditLog_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/AuditLog"));
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const Typebook_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Typebook"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
class AuditLogsController {
    getTypebookId(item) {
        const sources = [
            item.entityTable === 'typebooks' ? { typebooks_id: item.entityId } : null,
            item.entityKey,
            item.metadata,
            item.beforeData,
            item.afterData,
        ];
        for (const source of sources) {
            const id = Number(source?.typebooks_id || source?.typebook_id || source?.typebookId);
            if (Number.isInteger(id) && id > 0)
                return id;
        }
        return null;
    }
    async index({ auth, request, response }) {
        try {
            const authenticate = await auth.use('api').authenticate();
            const permissions = auth.use('api').token?.meta.payload.permissions || [];
            if (!(0, util_1.verifyPermission)(Boolean(authenticate.superuser), permissions, 38)) {
                return response.status(403).send({
                    message: 'Usuário sem permissão para acessar auditoria.',
                });
            }
            const { companies_id, user_id, action, entity_table, dateStart, dateEnd, search, limit, } = request.only([
                'companies_id',
                'user_id',
                'action',
                'entity_table',
                'dateStart',
                'dateEnd',
                'search',
                'limit',
            ]);
            const maxLimit = Math.min(Number(limit) || 200, 500);
            const effectiveCompanyId = authenticate.superuser && companies_id
                ? companies_id
                : authenticate.companies_id;
            const query = AuditLog_1.default.query()
                .orderBy('created_at', 'desc')
                .limit(maxLimit);
            query.where('companies_id', effectiveCompanyId);
            if (user_id) {
                const user = await User_1.default.query()
                    .where('id', user_id)
                    .andWhere('companies_id', effectiveCompanyId)
                    .first();
                if (!user)
                    return response.status(200).send([]);
                query.andWhere('user_id', user_id);
            }
            if (action)
                query.andWhere('action', action);
            if (entity_table)
                query.andWhere('entity_table', entity_table);
            if (dateStart) {
                const dateStartSql = luxon_1.DateTime.fromISO(dateStart).startOf('day').toFormat('yyyy-MM-dd HH:mm:ss');
                query.andWhere('created_at', '>=', dateStartSql);
            }
            if (dateEnd) {
                const dateEndSql = luxon_1.DateTime.fromISO(dateEnd).endOf('day').toFormat('yyyy-MM-dd HH:mm:ss');
                query.andWhere('created_at', '<=', dateEndSql);
            }
            if (search) {
                query.andWhere((builder) => {
                    builder
                        .where('description', 'like', `%${search}%`)
                        .orWhere('resource_key', 'like', `%${search}%`);
                });
            }
            const data = await query;
            const userIds = Array.from(new Set(data.map((item) => item.userId).filter(Boolean)));
            const companyIds = Array.from(new Set(data.map((item) => item.companiesId).filter(Boolean)));
            const typebookIds = Array.from(new Set(data.map((item) => this.getTypebookId(item)).filter(Boolean)));
            const users = userIds.length
                ? await User_1.default.query().whereIn('id', userIds).select('id', 'name', 'username')
                : [];
            const companies = companyIds.length
                ? await Company_1.default.query().whereIn('id', companyIds).select('id', 'name', 'shortname')
                : [];
            const typebooks = typebookIds.length
                ? await Typebook_1.default.query()
                    .where('companies_id', effectiveCompanyId)
                    .whereIn('id', typebookIds)
                    .select('id', 'name')
                : [];
            const usersById = new Map(users.map((user) => [user.id, user]));
            const companiesById = new Map(companies.map((company) => [company.id, company]));
            const typebooksById = new Map(typebooks.map((typebook) => [typebook.id, typebook]));
            return response.status(200).send(data.map((item) => {
                const typebookId = this.getTypebookId(item);
                return {
                    id: item.id,
                    companies_id: item.companiesId,
                    user_id: item.userId,
                    action: item.action,
                    entity_table: item.entityTable,
                    entity_id: item.entityId,
                    resource_key: item.resourceKey,
                    entity_key: item.entityKey,
                    description: item.description,
                    metadata: item.metadata,
                    changed_fields: item.changedFields,
                    before_data: item.beforeData,
                    after_data: item.afterData,
                    occurrence_count: item.occurrenceCount,
                    first_at: item.firstAt?.toISO(),
                    last_at: item.lastAt?.toISO(),
                    ip: item.ip,
                    created_at: item.createdAt?.toISO(),
                    updated_at: item.updatedAt?.toISO(),
                    user: item.userId ? usersById.get(item.userId) : null,
                    company: item.companiesId ? companiesById.get(item.companiesId) : null,
                    typebook: typebookId ? typebooksById.get(typebookId) : null,
                };
            }));
        }
        catch (error) {
            console.error('Erro ao consultar auditoria:', error);
            return response.status(500).send({
                message: 'Erro ao consultar auditoria.',
                error: error.message || String(error),
                code: error.code,
            });
        }
    }
}
exports.default = AuditLogsController;
//# sourceMappingURL=AuditLogsController.js.map