"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const CompanySpedyIntegration_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/CompanySpedyIntegration"));
const SpedyCompaniesService_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Spedy/SpedyCompaniesService"));
const CompanySpedyIntegrationValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/Spedy/CompanySpedyIntegrationValidator"));
const SpedyCompanyValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/Spedy/SpedyCompanyValidator"));
const SpedyCompanySettingsValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/Spedy/SpedyCompanySettingsValidator"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
class CompaniesController {
    constructor() {
        this.spedy = new SpedyCompaniesService_1.default();
        this.companyNfseSettingsPermissiongroupId = 43;
    }
    async requireSuperuser(auth) {
        const user = await auth.use('api').authenticate();
        if (!user.superuser) {
            throw new BadRequestException_1.default('Acesso permitido somente para super usuário', 403, 'spedy_superuser_required');
        }
        return user;
    }
    async requireCompanyNfseSettingsAccess(auth, companyId) {
        const user = await auth.use('api').authenticate();
        const permissions = auth.use('api').token?.meta.payload.permissions || [];
        if (user.superuser)
            return user;
        if (!(0, util_1.verifyPermission)(false, permissions, this.companyNfseSettingsPermissiongroupId)) {
            throw new BadRequestException_1.default('Usuario sem permissao para configurar NFS-e da empresa.', 403, 'spedy_company_nfse_settings_forbidden');
        }
        if (companyId && Number(companyId) !== Number(user.companies_id)) {
            throw new BadRequestException_1.default('Usuario sem permissao para configurar NFS-e desta empresa.', 403, 'spedy_company_nfse_settings_company_forbidden');
        }
        return user;
    }
    async getAllowedCompanyIntegration(auth, environment, spedyCompanyId) {
        const user = await this.requireCompanyNfseSettingsAccess(auth);
        if (user.superuser) {
            return CompanySpedyIntegration_1.default
                .query()
                .where('environment', environment)
                .where('spedy_company_id', spedyCompanyId)
                .first();
        }
        const integration = await CompanySpedyIntegration_1.default
            .query()
            .where('companies_id', user.companies_id)
            .where('environment', environment)
            .where('spedy_company_id', spedyCompanyId)
            .first();
        if (!integration) {
            throw new BadRequestException_1.default('Empresa NFS-e não vinculada a empresa logada.', 403, 'spedy_company_nfse_settings_link_forbidden');
        }
        return integration;
    }
    async getOwnerIntegration(environment = 'sandbox') {
        const integration = await CompanySpedyIntegration_1.default
            .query()
            .where('environment', environment)
            .where('is_owner', true)
            .where('active', true)
            .first();
        if (!integration?.spedyApiKey) {
            throw new BadRequestException_1.default('Integração Spedy owner não configurada', 400, 'spedy_owner_missing');
        }
        return integration;
    }
    async getCompanyCredential(environment, spedyCompanyId) {
        const integration = await CompanySpedyIntegration_1.default
            .query()
            .where('environment', environment)
            .where('spedy_company_id', spedyCompanyId)
            .where('active', true)
            .first();
        if (integration?.spedyApiKey) {
            return {
                integration,
                source: integration.isOwner ? 'owner' : 'company',
            };
        }
        return {
            integration: await this.getOwnerIntegration(environment),
            source: 'owner_fallback',
        };
    }
    serializeIntegration(integration) {
        if (!integration)
            return null;
        return {
            id: integration.id,
            companiesId: integration.companiesId,
            environment: integration.environment,
            spedyCompanyId: integration.spedyCompanyId,
            isOwner: integration.isOwner,
            active: integration.active,
            hasApiKey: !!integration.spedyApiKey,
            lastSyncAt: integration.lastSyncAt,
            lastCompanySnapshot: integration.lastCompanySnapshot,
        };
    }
    async list({ auth, request }) {
        await this.requireSuperuser(auth);
        const environment = request.input('environment', 'sandbox');
        const owner = await this.getOwnerIntegration(environment);
        return this.spedy.listCompanies(owner, request.qs());
    }
    async create({ auth, request }) {
        await this.requireSuperuser(auth);
        const environment = request.input('environment', 'sandbox');
        const owner = await this.getOwnerIntegration(environment);
        const payload = await request.validate(SpedyCompanyValidator_1.default);
        return this.spedy.createCompany(owner, payload);
    }
    async show({ auth, params, request }) {
        const environment = request.input('environment', 'sandbox');
        const localIntegration = await this.getAllowedCompanyIntegration(auth, environment, params.id);
        const owner = localIntegration?.spedyApiKey ? localIntegration : await this.getOwnerIntegration(environment);
        return this.spedy.getCompany(owner, params.id);
    }
    async update({ auth, params, request }) {
        const environment = request.input('environment', 'sandbox');
        const localIntegration = await this.getAllowedCompanyIntegration(auth, environment, params.id);
        const owner = localIntegration?.spedyApiKey ? localIntegration : await this.getOwnerIntegration(environment);
        const payload = await request.validate(SpedyCompanyValidator_1.default);
        return this.spedy.updateCompany(owner, params.id, payload);
    }
    async destroy({ auth, params, request }) {
        await this.requireSuperuser(auth);
        const environment = request.input('environment', 'sandbox');
        const owner = await this.getOwnerIntegration(environment);
        return this.spedy.deleteCompany(owner, params.id);
    }
    async settings({ auth, params, request }) {
        const environment = request.input('environment', 'sandbox');
        const localIntegration = await this.getAllowedCompanyIntegration(auth, environment, params.id);
        const owner = localIntegration?.spedyApiKey ? localIntegration : await this.getOwnerIntegration(environment);
        return this.spedy.getSettings(owner, params.id);
    }
    async updateSettings({ auth, params, request }) {
        const environment = request.input('environment', 'sandbox');
        const localIntegration = await this.getAllowedCompanyIntegration(auth, environment, params.id);
        const owner = localIntegration?.spedyApiKey ? localIntegration : await this.getOwnerIntegration(environment);
        const payload = await request.validate(SpedyCompanySettingsValidator_1.default);
        return this.spedy.updateSettings(owner, params.id, payload);
    }
    async serviceInvoiceCities({ auth, request }) {
        await this.requireCompanyNfseSettingsAccess(auth);
        const environment = request.input('environment', 'sandbox');
        const owner = await this.getOwnerIntegration(environment);
        return this.spedy.listServiceInvoiceCities(owner, request.qs());
    }
    async certificates({ auth, params, request }) {
        const environment = request.input('environment', 'sandbox');
        await this.getAllowedCompanyIntegration(auth, environment, params.id);
        const credential = await this.getCompanyCredential(environment, params.id);
        return this.spedy.getCertificates(credential.integration, params.id);
    }
    async uploadCertificate({ auth, params, request }) {
        const environment = request.input('environment', 'sandbox');
        await this.getAllowedCompanyIntegration(auth, environment, params.id);
        const credential = await this.getCompanyCredential(environment, params.id);
        const password = request.input('password');
        const file = request.file('file', {
            extnames: ['pfx', 'p12'],
            size: '10mb',
        }) || request.file('certificateFile', {
            extnames: ['pfx', 'p12'],
            size: '10mb',
        });
        if (!password) {
            throw new BadRequestException_1.default('Informe a senha do certificado', 400, 'spedy_certificate_password_missing');
        }
        if (!file) {
            throw new BadRequestException_1.default('Informe o arquivo do certificado digital', 400, 'spedy_certificate_file_missing');
        }
        if (!file.isValid) {
            throw new BadRequestException_1.default(file.errors?.[0]?.message || 'Arquivo do certificado digital inválido', 400, 'spedy_certificate_file_invalid');
        }
        const uploadResponse = await this.spedy.uploadCertificate(credential.integration, params.id, file, password);
        const certificates = await this.spedy.getCertificates(credential.integration, params.id);
        return {
            uploadResponse,
            certificates,
            credentialSource: credential.source,
        };
    }
    async showIntegration({ auth, params, request }) {
        await this.requireCompanyNfseSettingsAccess(auth, params.companyId);
        const environment = request.input('environment', 'sandbox');
        const integration = await CompanySpedyIntegration_1.default
            .query()
            .where('companies_id', params.companyId)
            .where('environment', environment)
            .first();
        return this.serializeIntegration(integration);
    }
    async saveIntegration({ auth, params, request }) {
        const user = await this.requireCompanyNfseSettingsAccess(auth, params.companyId);
        const payload = await request.validate(CompanySpedyIntegrationValidator_1.default);
        const environment = payload.environment || 'sandbox';
        await Company_1.default.findOrFail(params.companyId);
        let integration = await CompanySpedyIntegration_1.default
            .query()
            .where('companies_id', params.companyId)
            .where('environment', environment)
            .first();
        if (!integration) {
            integration = new CompanySpedyIntegration_1.default();
            integration.companiesId = Number(params.companyId);
            integration.environment = environment;
        }
        integration.spedyCompanyId = payload.spedyCompanyId || null;
        integration.isOwner = user.superuser && payload.isOwner === true;
        integration.active = payload.active !== undefined ? payload.active === true : true;
        if (payload.spedyApiKey !== undefined) {
            integration.spedyApiKey = payload.spedyApiKey || null;
        }
        if (payload.fetchCompany && integration.spedyCompanyId) {
            const credential = integration.spedyApiKey ? integration : await this.getOwnerIntegration(environment);
            const remote = await this.spedy.getCompany(credential, integration.spedyCompanyId);
            integration.lastCompanySnapshot = remote;
            integration.lastSyncAt = luxon_1.DateTime.local();
        }
        await integration.save();
        return this.serializeIntegration(integration);
    }
    async syncIntegration({ auth, params, request }) {
        await this.requireCompanyNfseSettingsAccess(auth, params.companyId);
        const environment = request.input('environment', 'sandbox');
        const integration = await CompanySpedyIntegration_1.default
            .query()
            .where('companies_id', params.companyId)
            .where('environment', environment)
            .firstOrFail();
        if (!integration.spedyCompanyId) {
            throw new BadRequestException_1.default('Empresa Spedy não vinculada', 400, 'spedy_company_missing');
        }
        const credential = integration.spedyApiKey ? integration : await this.getOwnerIntegration(environment);
        const remote = await this.spedy.getCompany(credential, integration.spedyCompanyId);
        integration.lastCompanySnapshot = remote;
        integration.lastSyncAt = luxon_1.DateTime.local();
        await integration.save();
        return this.serializeIntegration(integration);
    }
}
exports.default = CompaniesController;
//# sourceMappingURL=CompaniesController.js.map