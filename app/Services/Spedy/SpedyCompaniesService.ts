import https from 'https'
import fs from 'fs/promises'
import { URL, URLSearchParams } from 'url'
import BadRequestException from 'App/Exceptions/BadRequestException'
import CompanySpedyIntegration from 'App/Models/CompanySpedyIntegration'

type SpedyResponse = {
  statusCode?: number
  headers: any
  body: any
  rawBody: Buffer
}

export default class SpedyCompaniesService {
  private getBaseUrl(environment: string) {
    return environment === 'production'
      ? 'https://api.spedy.com.br/v1'
      : 'https://sandbox-api.spedy.com.br/v1'
  }

  private getHeaders(apiKey: string, extraHeaders: any = {}) {
    return {
      'X-Api-Key': apiKey,
      ...extraHeaders,
    }
  }

  private parseBody(buffer: Buffer, contentType?: string) {
    const raw = buffer.toString('utf8')

    if (contentType?.includes('application/json') && raw) {
      return JSON.parse(raw)
    }

    try {
      return raw ? JSON.parse(raw) : null
    } catch {
      return raw
    }
  }

  private ensureSuccess(response: SpedyResponse) {
    if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
      return
    }

    const message = Array.isArray(response.body?.errors)
      ? response.body.errors.map((error) => error.message).join(', ')
      : response.body?.message || 'Erro ao comunicar com a Spedy'

    throw new BadRequestException(message, response.statusCode || 400, 'spedy_request_error')
  }

  private request(environment: string, apiKey: string, method: string, path: string, payload?: any, extraHeaders: any = {}): Promise<SpedyResponse> {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.getBaseUrl(environment)}${path}`)
      const body = payload === undefined || payload === null ? null : Buffer.from(JSON.stringify(payload))
      const headers = this.getHeaders(apiKey, {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json', 'Content-Length': body.length } : {}),
        ...extraHeaders,
      })

      const req = https.request(url, { method, headers }, (res) => {
        const chunks: Buffer[] = []

        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        res.on('end', () => {
          const rawBody = Buffer.concat(chunks)
          const contentType = String(res.headers['content-type'] || '')

          try {
            const response = {
              statusCode: res.statusCode,
              headers: res.headers,
              body: this.parseBody(rawBody, contentType),
              rawBody,
            }

            this.ensureSuccess(response)
            resolve(response)
          } catch (error) {
            reject(error)
          }
        })
      })

      req.on('error', reject)
      if (body) req.write(body)
      req.end()
    })
  }

  private async multipartRequest(environment: string, apiKey: string, method: string, path: string, file: any, password: string): Promise<SpedyResponse> {
    if (!file?.tmpPath) {
      throw new BadRequestException('Certificado digital inválido', 400, 'spedy_certificate_invalid')
    }

    const boundary = `----digi3-spedy-${Date.now()}`
    const fileBuffer = await fs.readFile(file.tmpPath)
    const fileName = file.clientName || 'certificate.pfx'

    const parts = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="password"\r\n\r\n${password}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="certificateFile"; filename="${fileName}"\r\nContent-Type: application/x-pkcs12\r\n\r\n`),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]
    const body = Buffer.concat(parts)

    return new Promise((resolve, reject) => {
      const url = new URL(`${this.getBaseUrl(environment)}${path}`)
      const headers = this.getHeaders(apiKey, {
        Accept: 'application/json',
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      })

      const req = https.request(url, { method, headers }, (res) => {
        const chunks: Buffer[] = []

        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        res.on('end', () => {
          const rawBody = Buffer.concat(chunks)
          const contentType = String(res.headers['content-type'] || '')

          try {
            const response = {
              statusCode: res.statusCode,
              headers: res.headers,
              body: this.parseBody(rawBody, contentType),
              rawBody,
            }

            this.ensureSuccess(response)
            resolve(response)
          } catch (error) {
            reject(error)
          }
        })
      })

      req.on('error', reject)
      req.write(body)
      req.end()
    })
  }

  public async listCompanies(integration: CompanySpedyIntegration, query: any = {}) {
    const params = new URLSearchParams()
    if (query.page) params.append('page', query.page)
    if (query.pageSize) params.append('pageSize', query.pageSize)

    const response = await this.request(integration.environment, integration.spedyApiKey!, 'GET', `/companies${params.toString() ? `?${params.toString()}` : ''}`)
    return response.body
  }

  public async createCompany(integration: CompanySpedyIntegration, payload: any) {
    const response = await this.request(integration.environment, integration.spedyApiKey!, 'POST', '/companies', payload)
    return response.body
  }

  public async getCompany(integration: CompanySpedyIntegration, spedyCompanyId: string) {
    const response = await this.request(integration.environment, integration.spedyApiKey!, 'GET', `/companies/${spedyCompanyId}`)
    return response.body
  }

  public async updateCompany(integration: CompanySpedyIntegration, spedyCompanyId: string, payload: any) {
    const response = await this.request(integration.environment, integration.spedyApiKey!, 'PUT', `/companies/${spedyCompanyId}`, payload)
    return response.body
  }

  public async deleteCompany(integration: CompanySpedyIntegration, spedyCompanyId: string) {
    const response = await this.request(integration.environment, integration.spedyApiKey!, 'DELETE', `/companies/${spedyCompanyId}`)
    return response.body
  }

  public async getSettings(integration: CompanySpedyIntegration, spedyCompanyId: string) {
    const response = await this.request(integration.environment, integration.spedyApiKey!, 'GET', `/companies/${spedyCompanyId}/settings`)
    return response.body
  }

  public async updateSettings(integration: CompanySpedyIntegration, spedyCompanyId: string, payload: any) {
    const response = await this.request(integration.environment, integration.spedyApiKey!, 'PUT', `/companies/${spedyCompanyId}/settings`, payload)
    return response.body
  }

  public async listServiceInvoiceCities(integration: CompanySpedyIntegration, query: any = {}) {
    const params = new URLSearchParams()
    if (query.code) params.append('code', query.code)
    if (query.state) params.append('state', query.state)
    if (query.filterText) params.append('filterText', query.filterText)
    if (query.page) params.append('page', query.page)
    if (query.pageSize) params.append('pageSize', query.pageSize)

    const response = await this.request(integration.environment, integration.spedyApiKey!, 'GET', `/service-invoices/cities${params.toString() ? `?${params.toString()}` : ''}`)
    return response.body
  }

  public async getCertificates(integration: CompanySpedyIntegration, spedyCompanyId: string) {
    const response = await this.request(integration.environment, integration.spedyApiKey!, 'GET', `/companies/${spedyCompanyId}/certificates`)
    return response.body
  }

  public async uploadCertificate(integration: CompanySpedyIntegration, spedyCompanyId: string, file: any, password: string) {
    const response = await this.multipartRequest(integration.environment, integration.spedyApiKey!, 'POST', `/companies/${spedyCompanyId}/certificates`, file, password)
    return response.body
  }

  public async createServiceInvoice(integration: CompanySpedyIntegration, payload: any) {
    const response = await this.request(integration.environment, integration.spedyApiKey!, 'POST', '/service-invoices', payload)
    return response.body
  }

  public async getServiceInvoice(integration: CompanySpedyIntegration, spedyInvoiceId: string) {
    const response = await this.request(integration.environment, integration.spedyApiKey!, 'GET', `/service-invoices/${spedyInvoiceId}`)
    return response.body
  }

  public async cancelServiceInvoice(integration: CompanySpedyIntegration, spedyInvoiceId: string, justification: string) {
    const response = await this.request(integration.environment, integration.spedyApiKey!, 'DELETE', `/service-invoices/${spedyInvoiceId}`, { justification })
    return response.body
  }

  public async issueServiceInvoice(integration: CompanySpedyIntegration, spedyInvoiceId: string) {
    const response = await this.request(integration.environment, integration.spedyApiKey!, 'POST', `/service-invoices/${spedyInvoiceId}/issue`)
    return response.body
  }

  public async getServiceInvoiceXml(integration: CompanySpedyIntegration, spedyInvoiceId: string) {
    return this.request(integration.environment, integration.spedyApiKey!, 'GET', `/service-invoices/${spedyInvoiceId}/xml`, undefined, {
      Accept: 'application/xml,text/xml,*/*',
    })
  }

  public async getServiceInvoicePdf(integration: CompanySpedyIntegration, spedyInvoiceId: string) {
    return this.request(integration.environment, integration.spedyApiKey!, 'GET', `/service-invoices/${spedyInvoiceId}/pdf`, undefined, {
      Accept: 'application/pdf,*/*',
    })
  }
}
