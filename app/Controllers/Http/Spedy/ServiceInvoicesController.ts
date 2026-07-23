import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import BadRequestException from 'App/Exceptions/BadRequestException'
import CompanySpedyIntegration from 'App/Models/CompanySpedyIntegration'
import SpedyServiceInvoice from 'App/Models/SpedyServiceInvoice'
import SpedyCompaniesService from 'App/Services/Spedy/SpedyCompaniesService'
import SpedyServiceInvoiceValidator from 'App/Validators/Spedy/SpedyServiceInvoiceValidator'

export default class ServiceInvoicesController {
  private spedy = new SpedyCompaniesService()

  private getIssuerCompanyId(user: any, request: HttpContextContract['request']) {
    const companyId = Number(request.input('companyId') || user.companies_id)

    if (!user.superuser || !companyId) {
      return user.companies_id
    }

    return companyId
  }

  private async getCompanyIntegration(companiesId: number, environment: string = 'sandbox') {
    const integration = await CompanySpedyIntegration
      .query()
      .where('companies_id', companiesId)
      .where('environment', environment)
      .where('active', true)
      .first()

    if (!integration?.spedyCompanyId || !integration.spedyApiKey) {
      throw new BadRequestException('Empresa sem integração Spedy ativa ou token salvo', 400, 'spedy_company_token_missing')
    }

    return integration
  }

  private extractProcessingDetail(invoice: any) {
    return invoice?.processingDetail
      || invoice?.processingDetails
      || invoice?.errors
      || invoice?.error
      || invoice?.messages
      || invoice?.message
      || invoice?.rejectionReason
      || invoice?.statusReason
      || invoice?.details
      || null
  }

  private normalizeInvoice(invoice: any) {
    return {
      spedyInvoiceId: invoice?.id || null,
      status: invoice?.status || null,
      number: invoice?.number ? String(invoice.number) : null,
      processingDetail: this.extractProcessingDetail(invoice),
      responsePayload: invoice || null,
    }
  }

  private buildPayload(payload: any, integrationId: string) {
    const amount = Number(payload.amount || 0)
    const total: any = {
      invoiceAmount: amount,
      netAmount: amount,
      issBaseTax: amount,
    }

    if (payload.issRate !== undefined && payload.issRate !== null) {
      const issRate = Number(payload.issRate)
      total.issRate = issRate > 1 ? issRate / 100 : issRate
    }

    return {
      integrationId,
      effectiveDate: payload.effectiveDate
        ? DateTime.fromISO(String(payload.effectiveDate)).toISO()
        : DateTime.local().toISO(),
      sendEmailToCustomer: payload.sendEmailToCustomer || false,
      description: payload.description,
      cnaeCode: payload.cnaeCode || null,
      federalServiceCode: payload.federalServiceCode || null,
      cityServiceCode: payload.cityServiceCode || null,
      nbsCode: payload.nbsCode || null,
      taxationType: payload.taxationType || 'taxationInMunicipality',
      taxLocation: payload.taxLocation || 'companyMunicipality',
      receiver: payload.receiver || null,
      location: payload.location || null,
      total,
    }
  }

  public async index({ auth, request }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const companiesId = this.getIssuerCompanyId(user, request)
    const query = SpedyServiceInvoice
      .query()
      .where('companies_id', companiesId)
      .orderBy('id', 'desc')

    const status = request.input('status')
    if (status) query.where('status', status)

    return query.paginate(Number(request.input('page', 1)), Number(request.input('perPage', 20)))
  }

  public async store({ auth, request }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const payload = await request.validate(SpedyServiceInvoiceValidator)
    const environment = request.input('environment', 'sandbox')
    const companiesId = this.getIssuerCompanyId(user, request)
    const integration = await this.getCompanyIntegration(companiesId, environment)
    const integrationId = payload.integrationId || `digi3-nfse-${companiesId}-${Date.now()}`
    const requestPayload = this.buildPayload(payload, integrationId)
    const remote = await this.spedy.createServiceInvoice(integration, requestPayload)
    const normalized = this.normalizeInvoice(remote)

    return SpedyServiceInvoice.create({
      companiesId,
      environment,
      spedyCompanyId: integration.spedyCompanyId,
      integrationId,
      amount: payload.amount,
      receiverName: payload.receiver?.name || null,
      receiverFederalTaxNumber: payload.receiver?.federalTaxNumber || null,
      description: payload.description,
      effectiveDate: requestPayload.effectiveDate ? DateTime.fromISO(requestPayload.effectiveDate) : null,
      requestPayload,
      ...normalized,
    })
  }

  public async show({ auth, params }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const query = SpedyServiceInvoice.query().where('id', params.id)

    if (!user.superuser) query.where('companies_id', user.companies_id)

    return query.firstOrFail()
  }

  public async sync({ auth, params }: HttpContextContract) {
    const user = await auth.use('api').authenticate()
    const query = SpedyServiceInvoice.query().where('id', params.id)
    if (!user.superuser) query.where('companies_id', user.companies_id)
    const local = await query.firstOrFail()

    if (!local.spedyInvoiceId) {
      throw new BadRequestException('Nota sem ID na Spedy', 400, 'spedy_invoice_missing')
    }

    const integration = await this.getCompanyIntegration(local.companiesId, local.environment)
    const remote = await this.spedy.getServiceInvoice(integration, local.spedyInvoiceId)
    local.merge(this.normalizeInvoice(remote))
    await local.save()

    return local
  }
}
