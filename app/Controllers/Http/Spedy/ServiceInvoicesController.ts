import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import BadRequestException from 'App/Exceptions/BadRequestException'
import CompanySpedyIntegration from 'App/Models/CompanySpedyIntegration'
import SpedyServiceInvoice from 'App/Models/SpedyServiceInvoice'
import SpedyCompaniesService from 'App/Services/Spedy/SpedyCompaniesService'
import SpedyServiceInvoiceDefaultsValidator from 'App/Validators/Spedy/SpedyServiceInvoiceDefaultsValidator'
import SpedyServiceInvoiceValidator from 'App/Validators/Spedy/SpedyServiceInvoiceValidator'
import { verifyPermission } from 'App/Services/util'

export default class ServiceInvoicesController {
  private spedy = new SpedyCompaniesService()
  private serviceInvoicePermissiongroupId = 41

  private async authenticateWithPermission(auth: HttpContextContract['auth']) {
    const user = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []

    if (!verifyPermission(Boolean(user.superuser), permissions, this.serviceInvoicePermissiongroupId)) {
      throw new BadRequestException('Usuario sem permissao para acessar NFS-e Spedy.', 403, 'spedy_service_invoice_forbidden')
    }

    return user
  }

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

  private async getCompanyIntegrationRecord(companiesId: number, environment: string = 'sandbox') {
    const integration = await CompanySpedyIntegration
      .query()
      .where('companies_id', companiesId)
      .where('environment', environment)
      .first()

    if (!integration) {
      throw new BadRequestException('Empresa sem vínculo Spedy para este ambiente', 400, 'spedy_company_integration_missing')
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

  private async getLocalInvoice(user: any, id: number | string) {
    const query = SpedyServiceInvoice.query().where('id', id)

    if (!user.superuser) query.where('companies_id', user.companies_id)

    return query.firstOrFail()
  }

  private async getDownloadContext(user: any, id: number | string) {
    const local = await this.getLocalInvoice(user, id)

    if (!local.spedyInvoiceId) {
      throw new BadRequestException('Nota sem ID na Spedy', 400, 'spedy_invoice_missing')
    }

    const integration = await this.getCompanyIntegration(local.companiesId, local.environment)

    return { local, integration }
  }

  private getFileBaseName(local: SpedyServiceInvoice) {
    return `nfse-${local.number || local.id}`
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

  public async defaults({ auth, request }: HttpContextContract) {
    const user = await this.authenticateWithPermission(auth)
    const companiesId = this.getIssuerCompanyId(user, request)
    const environment = request.input('environment', 'sandbox')
    const integration = await this.getCompanyIntegrationRecord(companiesId, environment)

    return integration.serviceInvoiceDefaults || {}
  }

  public async saveDefaults({ auth, request }: HttpContextContract) {
    const user = await this.authenticateWithPermission(auth)
    const companiesId = this.getIssuerCompanyId(user, request)
    const environment = request.input('environment', 'sandbox')
    const payload = await request.validate(SpedyServiceInvoiceDefaultsValidator)
    const integration = await this.getCompanyIntegrationRecord(companiesId, environment)

    integration.serviceInvoiceDefaults = payload
    await integration.save()

    return integration.serviceInvoiceDefaults || {}
  }

  public async index({ auth, request }: HttpContextContract) {
    const user = await this.authenticateWithPermission(auth)
    const companiesId = this.getIssuerCompanyId(user, request)
    const query = SpedyServiceInvoice
      .query()
      .where('companies_id', companiesId)
      .orderBy('id', 'desc')

    const status = request.input('status')
    if (status) query.where('status', status)

    const receiverName = String(request.input('receiverName') || request.input('receiver') || '').trim()
    if (receiverName) {
      query.where('receiver_name', 'like', `%${receiverName}%`)
    }

    const returnText = String(request.input('returnText') || request.input('processingDetail') || '').trim()
    if (returnText) {
      query.where((builder) => {
        builder
          .whereRaw('LOWER(CAST(processing_detail AS CHAR)) LIKE ?', [`%${returnText.toLowerCase()}%`])
          .orWhereRaw('LOWER(CAST(response_payload AS CHAR)) LIKE ?', [`%${returnText.toLowerCase()}%`])
      })
    }

    return query.paginate(Number(request.input('page', 1)), Number(request.input('perPage', 20)))
  }

  public async store({ auth, request }: HttpContextContract) {
    const user = await this.authenticateWithPermission(auth)
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
    const user = await this.authenticateWithPermission(auth)
    return this.getLocalInvoice(user, params.id)
  }

  public async sync({ auth, params }: HttpContextContract) {
    const user = await this.authenticateWithPermission(auth)
    const { local, integration } = await this.getDownloadContext(user, params.id)
    const remote = await this.spedy.getServiceInvoice(integration, local.spedyInvoiceId!)
    local.merge(this.normalizeInvoice(remote))
    await local.save()

    return local
  }

  public async cancel({ auth, params, request }: HttpContextContract) {
    const user = await this.authenticateWithPermission(auth)
    const justification = String(request.input('justification') || '').trim()

    if (!justification) {
      throw new BadRequestException('Informe a justificativa do cancelamento', 400, 'spedy_cancel_justification_required')
    }

    const { local, integration } = await this.getDownloadContext(user, params.id)
    await this.spedy.cancelServiceInvoice(integration, local.spedyInvoiceId!, justification)
    const remote = await this.spedy.getServiceInvoice(integration, local.spedyInvoiceId!)
    local.merge(this.normalizeInvoice(remote))
    await local.save()

    return local
  }

  public async issue({ auth, params }: HttpContextContract) {
    const user = await this.authenticateWithPermission(auth)
    const { local, integration } = await this.getDownloadContext(user, params.id)
    await this.spedy.issueServiceInvoice(integration, local.spedyInvoiceId!)
    const remote = await this.spedy.getServiceInvoice(integration, local.spedyInvoiceId!)
    local.merge(this.normalizeInvoice(remote))
    await local.save()

    return local
  }

  public async xml({ auth, params, response }: HttpContextContract) {
    const user = await this.authenticateWithPermission(auth)
    const { local, integration } = await this.getDownloadContext(user, params.id)
    const remote = await this.spedy.getServiceInvoiceXml(integration, local.spedyInvoiceId!)

    response.header('Content-Type', String(remote.headers['content-type'] || 'application/xml'))
    response.header('Content-Disposition', `attachment; filename="${this.getFileBaseName(local)}.xml"`)
    return response.send(remote.rawBody)
  }

  public async pdf({ auth, params, response }: HttpContextContract) {
    const user = await this.authenticateWithPermission(auth)
    const { local, integration } = await this.getDownloadContext(user, params.id)
    const remote = await this.spedy.getServiceInvoicePdf(integration, local.spedyInvoiceId!)

    response.header('Content-Type', String(remote.headers['content-type'] || 'application/pdf'))
    response.header('Content-Disposition', `inline; filename="${this.getFileBaseName(local)}.pdf"`)
    return response.send(remote.rawBody)
  }
}
