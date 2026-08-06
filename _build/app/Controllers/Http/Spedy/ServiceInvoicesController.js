"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const CompanySpedyIntegration_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/CompanySpedyIntegration"));
const SpedyServiceInvoice_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/SpedyServiceInvoice"));
const SpedyCompaniesService_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Spedy/SpedyCompaniesService"));
const SpedyServiceInvoiceDefaultsValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/Spedy/SpedyServiceInvoiceDefaultsValidator"));
const SpedyServiceInvoiceValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/Spedy/SpedyServiceInvoiceValidator"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/util");
class ServiceInvoicesController {
    constructor() {
        this.spedy = new SpedyCompaniesService_1.default();
        this.serviceInvoicePermissiongroupId = 41;
    }
    async authenticateWithPermission(auth) {
        const user = await auth.use('api').authenticate();
        const permissions = auth.use('api').token?.meta.payload.permissions || [];
        if (!(0, util_1.verifyPermission)(Boolean(user.superuser), permissions, this.serviceInvoicePermissiongroupId)) {
            throw new BadRequestException_1.default('Usuario sem permissao para acessar NFS-e Spedy.', 403, 'spedy_service_invoice_forbidden');
        }
        return user;
    }
    getIssuerCompanyId(user, request) {
        const companyId = Number(request.input('companyId') || user.companies_id);
        if (!user.superuser || !companyId) {
            return user.companies_id;
        }
        return companyId;
    }
    async getCompanyIntegration(companiesId, environment = 'sandbox') {
        const integration = await CompanySpedyIntegration_1.default
            .query()
            .where('companies_id', companiesId)
            .where('environment', environment)
            .where('active', true)
            .first();
        if (!integration?.spedyCompanyId || !integration.spedyApiKey) {
            throw new BadRequestException_1.default('Empresa sem integração Spedy ativa ou token salvo', 400, 'spedy_company_token_missing');
        }
        return integration;
    }
    async getCompanyIntegrationRecord(companiesId, environment = 'sandbox') {
        const integration = await CompanySpedyIntegration_1.default
            .query()
            .where('companies_id', companiesId)
            .where('environment', environment)
            .first();
        if (!integration) {
            throw new BadRequestException_1.default('Empresa sem vínculo Spedy para este ambiente', 400, 'spedy_company_integration_missing');
        }
        return integration;
    }
    extractProcessingDetail(invoice) {
        return invoice?.processingDetail
            || invoice?.processingDetails
            || invoice?.errors
            || invoice?.error
            || invoice?.messages
            || invoice?.message
            || invoice?.rejectionReason
            || invoice?.statusReason
            || invoice?.details
            || null;
    }
    normalizeInvoice(invoice) {
        return {
            spedyInvoiceId: invoice?.id || null,
            status: invoice?.status || null,
            number: invoice?.number ? String(invoice.number) : null,
            processingDetail: this.extractProcessingDetail(invoice),
            responsePayload: invoice || null,
        };
    }
    async getLocalInvoice(user, id) {
        const query = SpedyServiceInvoice_1.default.query().where('id', id);
        if (!user.superuser)
            query.where('companies_id', user.companies_id);
        return query.firstOrFail();
    }
    async getDownloadContext(user, id) {
        const local = await this.getLocalInvoice(user, id);
        if (!local.spedyInvoiceId) {
            throw new BadRequestException_1.default('Nota sem ID na Spedy', 400, 'spedy_invoice_missing');
        }
        const integration = await this.getCompanyIntegration(local.companiesId, local.environment);
        return { local, integration };
    }
    getFileBaseName(local) {
        return `nfse-${local.number || local.id}`;
    }
    hasValue(value) {
        return String(value ?? '').trim() !== '';
    }
    onlyDigits(value) {
        return String(value ?? '').replace(/\D/g, '');
    }
    sanitizeReceiver(receiver) {
        if (!receiver)
            return null;
        const address = receiver.address || null;
        const city = address?.city || null;
        const postalCode = this.onlyDigits(address?.postalCode);
        const cityCode = this.onlyDigits(city?.code);
        const hasAddress = [
            address?.street,
            address?.number,
            address?.district,
            address?.additionalInformation,
            postalCode,
            cityCode,
            city?.name,
            city?.state,
        ].some((value) => this.hasValue(value));
        if (hasAddress && !postalCode) {
            throw new BadRequestException_1.default('Informe o CEP do tomador ou deixe todos os campos de endereço em branco.', 400, 'spedy_receiver_postal_code_required');
        }
        if (postalCode && !cityCode && (!this.hasValue(city?.name) || !this.hasValue(city?.state))) {
            throw new BadRequestException_1.default('Informe a cidade do tomador pelo código IBGE ou por cidade e UF.', 400, 'spedy_receiver_city_required');
        }
        return {
            ...receiver,
            address: hasAddress
                ? {
                    ...address,
                    postalCode,
                    city: {
                        ...city,
                        code: cityCode ? Number(cityCode) : null,
                        state: city?.state ? String(city.state).toUpperCase() : null,
                    },
                }
                : undefined,
        };
    }
    buildPayload(payload, integrationId) {
        const amount = Number(payload.amount || 0);
        const total = {
            invoiceAmount: amount,
            netAmount: amount,
            issBaseTax: amount,
        };
        if (payload.issRate !== undefined && payload.issRate !== null) {
            const issRate = Number(payload.issRate);
            total.issRate = issRate > 1 ? issRate / 100 : issRate;
        }
        return {
            integrationId,
            effectiveDate: payload.effectiveDate
                ? luxon_1.DateTime.fromISO(String(payload.effectiveDate)).toISO()
                : luxon_1.DateTime.local().toISO(),
            sendEmailToCustomer: payload.sendEmailToCustomer || false,
            description: payload.description,
            cnaeCode: payload.cnaeCode || null,
            federalServiceCode: payload.federalServiceCode || null,
            cityServiceCode: payload.cityServiceCode || null,
            nbsCode: payload.nbsCode || null,
            taxationType: payload.taxationType || 'taxationInMunicipality',
            taxLocation: payload.taxLocation || 'companyMunicipality',
            receiver: this.sanitizeReceiver(payload.receiver),
            location: payload.location || null,
            total,
        };
    }
    async defaults({ auth, request }) {
        const user = await this.authenticateWithPermission(auth);
        const companiesId = this.getIssuerCompanyId(user, request);
        const environment = request.input('environment', 'sandbox');
        const integration = await this.getCompanyIntegrationRecord(companiesId, environment);
        return integration.serviceInvoiceDefaults || {};
    }
    async saveDefaults({ auth, request }) {
        const user = await this.authenticateWithPermission(auth);
        const companiesId = this.getIssuerCompanyId(user, request);
        const environment = request.input('environment', 'sandbox');
        const payload = await request.validate(SpedyServiceInvoiceDefaultsValidator_1.default);
        const integration = await this.getCompanyIntegrationRecord(companiesId, environment);
        integration.serviceInvoiceDefaults = payload;
        await integration.save();
        return integration.serviceInvoiceDefaults || {};
    }
    async index({ auth, request }) {
        const user = await this.authenticateWithPermission(auth);
        const companiesId = this.getIssuerCompanyId(user, request);
        const query = SpedyServiceInvoice_1.default
            .query()
            .where('companies_id', companiesId)
            .orderBy('id', 'desc');
        const status = request.input('status');
        if (status)
            query.where('status', status);
        const receiverName = String(request.input('receiverName') || request.input('receiver') || '').trim();
        if (receiverName) {
            query.where('receiver_name', 'like', `%${receiverName}%`);
        }
        const returnText = String(request.input('returnText') || request.input('processingDetail') || '').trim();
        if (returnText) {
            query.where((builder) => {
                builder
                    .whereRaw('LOWER(CAST(processing_detail AS CHAR)) LIKE ?', [`%${returnText.toLowerCase()}%`])
                    .orWhereRaw('LOWER(CAST(response_payload AS CHAR)) LIKE ?', [`%${returnText.toLowerCase()}%`]);
            });
        }
        return query.paginate(Number(request.input('page', 1)), Number(request.input('perPage', 20)));
    }
    async store({ auth, request }) {
        const user = await this.authenticateWithPermission(auth);
        const payload = await request.validate(SpedyServiceInvoiceValidator_1.default);
        const environment = request.input('environment', 'sandbox');
        const companiesId = this.getIssuerCompanyId(user, request);
        const integration = await this.getCompanyIntegration(companiesId, environment);
        const integrationId = payload.integrationId || `digi3-nfse-${companiesId}-${Date.now()}`;
        const requestPayload = this.buildPayload(payload, integrationId);
        const existing = await SpedyServiceInvoice_1.default
            .query()
            .where('companies_id', companiesId)
            .where('integration_id', integrationId)
            .first();
        if (existing && existing.environment !== environment) {
            throw new BadRequestException_1.default('A NFS-e original pertence a outro ambiente.', 400, 'spedy_service_invoice_environment_mismatch');
        }
        const remote = await this.spedy.createServiceInvoice(integration, requestPayload);
        const normalized = this.normalizeInvoice(remote);
        if (existing) {
            existing.merge({
                environment,
                spedyCompanyId: integration.spedyCompanyId,
                amount: payload.amount,
                receiverName: payload.receiver?.name || null,
                receiverFederalTaxNumber: payload.receiver?.federalTaxNumber || null,
                description: payload.description,
                effectiveDate: requestPayload.effectiveDate ? luxon_1.DateTime.fromISO(requestPayload.effectiveDate) : null,
                requestPayload,
                ...normalized,
            });
            await existing.save();
            return existing;
        }
        return SpedyServiceInvoice_1.default.create({
            companiesId,
            environment,
            spedyCompanyId: integration.spedyCompanyId,
            integrationId,
            amount: payload.amount,
            receiverName: payload.receiver?.name || null,
            receiverFederalTaxNumber: payload.receiver?.federalTaxNumber || null,
            description: payload.description,
            effectiveDate: requestPayload.effectiveDate ? luxon_1.DateTime.fromISO(requestPayload.effectiveDate) : null,
            requestPayload,
            ...normalized,
        });
    }
    async show({ auth, params }) {
        const user = await this.authenticateWithPermission(auth);
        return this.getLocalInvoice(user, params.id);
    }
    async sync({ auth, params }) {
        const user = await this.authenticateWithPermission(auth);
        const { local, integration } = await this.getDownloadContext(user, params.id);
        const remote = await this.spedy.getServiceInvoice(integration, local.spedyInvoiceId);
        local.merge(this.normalizeInvoice(remote));
        await local.save();
        return local;
    }
    async cancel({ auth, params, request }) {
        const user = await this.authenticateWithPermission(auth);
        const justification = String(request.input('justification') || request.input('reason') || request.input('Reason') || '').trim();
        if (!justification) {
            throw new BadRequestException_1.default('Informe a justificativa do cancelamento', 400, 'spedy_cancel_justification_required');
        }
        if (justification.length < 15) {
            throw new BadRequestException_1.default('A justificativa do cancelamento deve ter pelo menos 15 caracteres', 400, 'spedy_cancel_justification_min_length');
        }
        const { local, integration } = await this.getDownloadContext(user, params.id);
        await this.spedy.cancelServiceInvoice(integration, local.spedyInvoiceId, justification);
        const remote = await this.spedy.getServiceInvoice(integration, local.spedyInvoiceId);
        local.merge(this.normalizeInvoice(remote));
        await local.save();
        return local;
    }
    async issue({ auth, params }) {
        const user = await this.authenticateWithPermission(auth);
        const { local, integration } = await this.getDownloadContext(user, params.id);
        await this.spedy.issueServiceInvoice(integration, local.spedyInvoiceId);
        const remote = await this.spedy.getServiceInvoice(integration, local.spedyInvoiceId);
        local.merge(this.normalizeInvoice(remote));
        await local.save();
        return local;
    }
    async xml({ auth, params, response }) {
        const user = await this.authenticateWithPermission(auth);
        const { local, integration } = await this.getDownloadContext(user, params.id);
        const remote = await this.spedy.getServiceInvoiceXml(integration, local.spedyInvoiceId);
        response.header('Content-Type', String(remote.headers['content-type'] || 'application/xml'));
        response.header('Content-Disposition', `attachment; filename="${this.getFileBaseName(local)}.xml"`);
        return response.send(remote.rawBody);
    }
    async pdf({ auth, params, response }) {
        const user = await this.authenticateWithPermission(auth);
        const { local, integration } = await this.getDownloadContext(user, params.id);
        const remote = await this.spedy.getServiceInvoicePdf(integration, local.spedyInvoiceId);
        response.header('Content-Type', String(remote.headers['content-type'] || 'application/pdf'));
        response.header('Content-Disposition', `inline; filename="${this.getFileBaseName(local)}.pdf"`);
        return response.send(remote.rawBody);
    }
}
exports.default = ServiceInvoicesController;
//# sourceMappingURL=ServiceInvoicesController.js.map