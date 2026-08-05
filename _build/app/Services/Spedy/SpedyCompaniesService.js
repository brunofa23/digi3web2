"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = __importDefault(require("https"));
const promises_1 = __importDefault(require("fs/promises"));
const url_1 = require("url");
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
class SpedyCompaniesService {
    getBaseUrl(environment) {
        return environment === 'production'
            ? 'https://api.spedy.com.br/v1'
            : 'https://sandbox-api.spedy.com.br/v1';
    }
    getHeaders(apiKey, extraHeaders = {}) {
        return {
            'X-Api-Key': apiKey,
            ...extraHeaders,
        };
    }
    parseBody(buffer, contentType) {
        const raw = buffer.toString('utf8');
        if (contentType?.includes('application/json') && raw) {
            return JSON.parse(raw);
        }
        try {
            return raw ? JSON.parse(raw) : null;
        }
        catch {
            return raw;
        }
    }
    ensureSuccess(response) {
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            return;
        }
        const message = Array.isArray(response.body?.errors)
            ? response.body.errors.map((error) => error.message).join(', ')
            : response.body?.message || 'Erro ao comunicar com a Spedy';
        throw new BadRequestException_1.default(message, response.statusCode || 400, 'spedy_request_error');
    }
    request(environment, apiKey, method, path, payload, extraHeaders = {}) {
        return new Promise((resolve, reject) => {
            const url = new url_1.URL(`${this.getBaseUrl(environment)}${path}`);
            const body = payload === undefined || payload === null ? null : Buffer.from(JSON.stringify(payload));
            const headers = this.getHeaders(apiKey, {
                Accept: 'application/json',
                ...(body ? { 'Content-Type': 'application/json', 'Content-Length': body.length } : {}),
                ...extraHeaders,
            });
            const req = https_1.default.request(url, { method, headers }, (res) => {
                const chunks = [];
                res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
                res.on('end', () => {
                    const rawBody = Buffer.concat(chunks);
                    const contentType = String(res.headers['content-type'] || '');
                    try {
                        const response = {
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: this.parseBody(rawBody, contentType),
                            rawBody,
                        };
                        this.ensureSuccess(response);
                        resolve(response);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
            req.on('error', reject);
            if (body)
                req.write(body);
            req.end();
        });
    }
    async multipartRequest(environment, apiKey, method, path, file, password) {
        if (!file?.tmpPath) {
            throw new BadRequestException_1.default('Certificado digital inválido', 400, 'spedy_certificate_invalid');
        }
        const boundary = `----digi3-spedy-${Date.now()}`;
        const fileBuffer = await promises_1.default.readFile(file.tmpPath);
        const fileName = file.clientName || 'certificate.pfx';
        const parts = [
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="password"\r\n\r\n${password}\r\n`),
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="Password"\r\n\r\n${password}\r\n`),
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="CertificateFile"; filename="${fileName}"\r\nContent-Type: application/x-pkcs12\r\n\r\n`),
            fileBuffer,
            Buffer.from(`\r\n--${boundary}--\r\n`),
        ];
        const body = Buffer.concat(parts);
        return new Promise((resolve, reject) => {
            const url = new url_1.URL(`${this.getBaseUrl(environment)}${path}`);
            const headers = this.getHeaders(apiKey, {
                Accept: 'application/json',
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length,
            });
            const req = https_1.default.request(url, { method, headers }, (res) => {
                const chunks = [];
                res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
                res.on('end', () => {
                    const rawBody = Buffer.concat(chunks);
                    const contentType = String(res.headers['content-type'] || '');
                    try {
                        const response = {
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: this.parseBody(rawBody, contentType),
                            rawBody,
                        };
                        this.ensureSuccess(response);
                        resolve(response);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }
    async listCompanies(integration, query = {}) {
        const params = new url_1.URLSearchParams();
        if (query.page)
            params.append('page', query.page);
        if (query.pageSize)
            params.append('pageSize', query.pageSize);
        const response = await this.request(integration.environment, integration.spedyApiKey, 'GET', `/companies${params.toString() ? `?${params.toString()}` : ''}`);
        return response.body;
    }
    async createCompany(integration, payload) {
        const response = await this.request(integration.environment, integration.spedyApiKey, 'POST', '/companies', payload);
        return response.body;
    }
    async getCompany(integration, spedyCompanyId) {
        const response = await this.request(integration.environment, integration.spedyApiKey, 'GET', `/companies/${spedyCompanyId}`);
        return response.body;
    }
    async updateCompany(integration, spedyCompanyId, payload) {
        const response = await this.request(integration.environment, integration.spedyApiKey, 'PUT', `/companies/${spedyCompanyId}`, payload);
        return response.body;
    }
    async deleteCompany(integration, spedyCompanyId) {
        const response = await this.request(integration.environment, integration.spedyApiKey, 'DELETE', `/companies/${spedyCompanyId}`);
        return response.body;
    }
    async getSettings(integration, spedyCompanyId) {
        const response = await this.request(integration.environment, integration.spedyApiKey, 'GET', `/companies/${spedyCompanyId}/settings`);
        return response.body;
    }
    async updateSettings(integration, spedyCompanyId, payload) {
        const response = await this.request(integration.environment, integration.spedyApiKey, 'PUT', `/companies/${spedyCompanyId}/settings`, payload);
        return response.body;
    }
    async listServiceInvoiceCities(integration, query = {}) {
        const params = new url_1.URLSearchParams();
        if (query.code)
            params.append('code', query.code);
        if (query.state)
            params.append('state', query.state);
        if (query.filterText)
            params.append('filterText', query.filterText);
        if (query.page)
            params.append('page', query.page);
        if (query.pageSize)
            params.append('pageSize', query.pageSize);
        const response = await this.request(integration.environment, integration.spedyApiKey, 'GET', `/service-invoices/cities${params.toString() ? `?${params.toString()}` : ''}`);
        return response.body;
    }
    async getCertificates(integration, spedyCompanyId) {
        const response = await this.request(integration.environment, integration.spedyApiKey, 'GET', `/companies/${spedyCompanyId}/certificates`);
        return response.body;
    }
    async uploadCertificate(integration, spedyCompanyId, file, password) {
        const response = await this.multipartRequest(integration.environment, integration.spedyApiKey, 'POST', `/companies/${spedyCompanyId}/certificates`, file, password);
        return response.body;
    }
    async createServiceInvoice(integration, payload) {
        const response = await this.request(integration.environment, integration.spedyApiKey, 'POST', '/service-invoices', payload);
        return response.body;
    }
    async getServiceInvoice(integration, spedyInvoiceId) {
        const response = await this.request(integration.environment, integration.spedyApiKey, 'GET', `/service-invoices/${spedyInvoiceId}`);
        return response.body;
    }
    async cancelServiceInvoice(integration, spedyInvoiceId, justification) {
        const response = await this.request(integration.environment, integration.spedyApiKey, 'DELETE', `/service-invoices/${spedyInvoiceId}`, { justification });
        return response.body;
    }
    async issueServiceInvoice(integration, spedyInvoiceId) {
        const response = await this.request(integration.environment, integration.spedyApiKey, 'POST', `/service-invoices/${spedyInvoiceId}/issue`);
        return response.body;
    }
    async getServiceInvoiceXml(integration, spedyInvoiceId) {
        return this.request(integration.environment, integration.spedyApiKey, 'GET', `/service-invoices/${spedyInvoiceId}/xml`, undefined, {
            Accept: 'application/xml,text/xml,*/*',
        });
    }
    async getServiceInvoicePdf(integration, spedyInvoiceId) {
        return this.request(integration.environment, integration.spedyApiKey, 'GET', `/service-invoices/${spedyInvoiceId}/pdf`, undefined, {
            Accept: 'application/pdf,*/*',
        });
    }
}
exports.default = SpedyCompaniesService;
//# sourceMappingURL=SpedyCompaniesService.js.map