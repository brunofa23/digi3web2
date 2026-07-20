import * as https from 'https'
import { URL, URLSearchParams } from 'url'
import BadRequestException from 'App/Exceptions/BadRequestException'
import CompanyFiscalIntegration from 'App/Models/CompanyFiscalIntegration'

type SpedyResponse = {
  statusCode: number
  headers: any
  body: any
  rawBody: Buffer
}

export default class SpedyNfseService {
  private baseUrl(config: CompanyFiscalIntegration) {
    return config.environment === 'production'
      ? 'https://api.spedy.com.br/v1'
      : 'https://sandbox-api.spedy.com.br/v1'
  }

  private headers(config: CompanyFiscalIntegration, extra: any = {}) {
    if (!config.spedyApiKey) {
      throw new BadRequestException('Chave da API Spedy não configurada para esta empresa', 400, 'spedy_api_key_missing')
    }

    return {
      'X-Api-Key': config.spedyApiKey,
      ...extra,
    }
  }

  private request(config: CompanyFiscalIntegration, method: string, path: string, payload?: any, extraHeaders: any = {}): Promise<SpedyResponse> {
    const url = new URL(`${this.baseUrl(config)}${path}`)
    const body = payload ? Buffer.from(JSON.stringify(payload)) : null
    const headers = this.headers(config, {
      Accept: 'application/json',
      ...extraHeaders,
    })

    if (body) {
      headers['Content-Type'] = 'application/json'
      headers['Content-Length'] = body.length
    }

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          method,
          hostname: url.hostname,
          path: `${url.pathname}${url.search}`,
          headers,
        },
        (res) => {
          const chunks: Buffer[] = []
          res.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
          res.on('end', () => {
            const rawBody = Buffer.concat(chunks)
            const contentType = String(res.headers['content-type'] || '')
            let responseBody: any = rawBody

            if (contentType.includes('application/json')) {
              try {
                responseBody = JSON.parse(rawBody.toString('utf8') || '{}')
              } catch (error) {
                responseBody = {}
              }
            }

            resolve({
              statusCode: res.statusCode || 0,
              headers: res.headers,
              body: responseBody,
              rawBody,
            })
          })
        }
      )

      req.on('error', reject)

      if (body) req.write(body)
      req.end()
    })
  }

  private ensureSuccess(response: SpedyResponse) {
    if (response.statusCode >= 200 && response.statusCode < 300) return

    const message = Array.isArray(response.body?.errors)
      ? response.body.errors.map((error) => error.message).join('; ')
      : response.body?.message || 'Erro ao comunicar com a Spedy'

    throw new BadRequestException(message, response.statusCode || 400, 'spedy_request_error')
  }

  public async listCities(config: CompanyFiscalIntegration, query: any) {
    const params = new URLSearchParams()
    if (query.code) params.append('code', query.code)
    if (query.state) params.append('state', query.state)
    params.append('page', String(query.page || 1))
    params.append('pageSize', String(query.pageSize || 20))

    const response = await this.request(config, 'GET', `/service-invoices/cities?${params.toString()}`)
    this.ensureSuccess(response)
    return response.body
  }

  public async createInvoice(config: CompanyFiscalIntegration, payload: any) {
    const response = await this.request(config, 'POST', '/service-invoices', payload)
    this.ensureSuccess(response)
    return response.body
  }

  public async getInvoice(config: CompanyFiscalIntegration, spedyInvoiceId: string) {
    const response = await this.request(config, 'GET', `/service-invoices/${spedyInvoiceId}`)
    this.ensureSuccess(response)
    return response.body
  }

  public async checkStatus(config: CompanyFiscalIntegration, spedyInvoiceId: string) {
    const response = await this.request(config, 'POST', `/service-invoices/${spedyInvoiceId}/check-status`)
    this.ensureSuccess(response)
    return response.body
  }

  public async cancelInvoice(config: CompanyFiscalIntegration, spedyInvoiceId: string, justification: string) {
    const response = await this.request(config, 'DELETE', `/service-invoices/${spedyInvoiceId}`, { justification })
    this.ensureSuccess(response)
    return response.body
  }

  public async download(config: CompanyFiscalIntegration, spedyInvoiceId: string, type: 'xml' | 'pdf') {
    const response = await this.request(config, 'GET', `/service-invoices/${spedyInvoiceId}/${type}`, null, {
      Accept: type === 'xml' ? 'application/xml' : 'application/pdf',
    })
    this.ensureSuccess(response)
    return response
  }
}
