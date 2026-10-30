import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import fs from 'fs/promises'
import BadRequestException from 'App/Exceptions/BadRequestException'
import CompanySpedyIntegration from 'App/Models/CompanySpedyIntegration'
import SpedyServiceInvoice from 'App/Models/SpedyServiceInvoice'
import FinAccount from 'App/Models/FinAccount'
import SpedyNfseExportJob from 'App/Models/SpedyNfseExportJob'
import { enqueueExport, exportPath } from 'App/Services/Spedy/SpedyNfseExportService'
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
    const issuedOn = invoice?.issuedOn ? DateTime.fromISO(String(invoice.issuedOn), { setZone: true }) : null
    return {
      spedyInvoiceId: invoice?.id || null,
      status: invoice?.status || null,
      number: invoice?.number ? String(invoice.number) : null,
      ...(issuedOn?.isValid ? { issuedOn } : {}),
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

  private hasValue(value: any) {
    return String(value ?? '').trim() !== ''
  }

  private onlyDigits(value: any) {
    return String(value ?? '').replace(/\D/g, '')
  }

  private sanitizeReceiver(receiver: any) {
    if (!receiver) return null

    const address = receiver.address || null
    const city = address?.city || null
    const postalCode = this.onlyDigits(address?.postalCode)
    const cityCode = this.onlyDigits(city?.code)
    const hasAddress = [
      address?.street,
      address?.number,
      address?.district,
      address?.additionalInformation,
      postalCode,
      cityCode,
      city?.name,
      city?.state,
    ].some((value) => this.hasValue(value))

    if (hasAddress && !postalCode) {
      throw new BadRequestException('Informe o CEP do tomador ou deixe todos os campos de endereço em branco.', 400, 'spedy_receiver_postal_code_required')
    }

    if (postalCode && !cityCode && (!this.hasValue(city?.name) || !this.hasValue(city?.state))) {
      throw new BadRequestException('Informe a cidade do tomador pelo código IBGE ou por cidade e UF.', 400, 'spedy_receiver_city_required')
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
      receiver: this.sanitizeReceiver(payload.receiver),
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

    if (String(request.input('pendingSync', false)) === 'true') {
      query.where((builder) => builder.whereNull('status').orWhereNot('status', 'authorized'))
    }

    const dateStart = request.input('dateStart') || request.input('date_start')
    if (dateStart) {
      const parsedDateStart = DateTime.fromISO(String(dateStart))
      if (parsedDateStart.isValid) {
        const start = parsedDateStart.startOf('day').toSQL() as string
        query.where((builder) => builder.where('issued_on', '>=', start)
          .orWhere((fallback) => fallback.whereNull('issued_on').where('created_at', '>=', start)))
      }
    }

    const dateEnd = request.input('dateEnd') || request.input('date_end')
    if (dateEnd) {
      const parsedDateEnd = DateTime.fromISO(String(dateEnd))
      if (parsedDateEnd.isValid) {
        const end = parsedDateEnd.endOf('day').toSQL() as string
        query.where((builder) => builder.where('issued_on', '<=', end)
          .orWhere((fallback) => fallback.whereNull('issued_on').where('created_at', '<=', end)))
      }
    }

    const receiverName = String(request.input('receiverName') || request.input('receiver') || '').trim()
    if (receiverName) {
      query.where('receiver_name', 'like', `%${receiverName}%`)
    }

    const receiverFederalTaxNumber = this.onlyDigits(
      request.input('receiverFederalTaxNumber') || request.input('federalTaxNumber') || request.input('cpfCnpj')
    )
    if (receiverFederalTaxNumber) {
      query.where('receiver_federal_tax_number', 'like', `%${receiverFederalTaxNumber}%`)
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
    if (payload.finAccountId) {
      const account = await FinAccount.query()
        .where('id', payload.finAccountId)
        .where('companies_id', companiesId)
        .where('debit_credit', 'C')
        .whereNotNull('entity_id')
        .first()
      if (!account) {
        throw new BadRequestException('Lançamento não encontrado ou não elegível para emissão de NFS-e.', 400, 'spedy_fin_account_invalid')
      }
      const linkedInvoice = await SpedyServiceInvoice.query()
        .where('companies_id', companiesId)
        .where('fin_account_id', payload.finAccountId)
        .first()
      if (linkedInvoice && linkedInvoice.integrationId !== payload.integrationId) {
        throw new BadRequestException('Este lançamento já possui uma NFS-e vinculada.', 400, 'spedy_fin_account_invoice_exists')
      }
    }
    const integrationId = payload.integrationId || `digi3-nfse-${companiesId}-${Date.now()}`
    const requestPayload = this.buildPayload(payload, integrationId)
    const existing = await SpedyServiceInvoice
      .query()
      .where('companies_id', companiesId)
      .where('integration_id', integrationId)
      .first()

    if (existing && existing.environment !== environment) {
      throw new BadRequestException('A NFS-e original pertence a outro ambiente.', 400, 'spedy_service_invoice_environment_mismatch')
    }

    const remote = await this.spedy.createServiceInvoice(integration, requestPayload)
    const normalized = this.normalizeInvoice(remote)

    return SpedyServiceInvoice.saveWithHistory({
      companiesId,
      finAccountId: payload.finAccountId || existing?.finAccountId || null,
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
    }, existing ? 'correction' : 'emission', existing?.id)
  }

  public async createExport({ auth, request }: HttpContextContract) {
    const user = await this.authenticateWithPermission(auth)
    const companiesId = this.getIssuerCompanyId(user, request)
    const format = String(request.input('format') || '')
    const submitted = request.input('ids')
    if (!['xml', 'pdf'].includes(format) || !Array.isArray(submitted)
      || !submitted.length || submitted.length > 2000
      || submitted.some((id) => !Number.isSafeInteger(Number(id)) || Number(id) <= 0)) {
      throw new BadRequestException('Selecione entre 1 e 2000 notas e informe XML ou PDF.', 400, 'spedy_export_invalid')
    }
    const ids = [...new Set(submitted.map(Number))]
    const invoices = await SpedyServiceInvoice.query()
      .where('companies_id', companiesId).whereIn('id', ids)
      .where('status', 'authorized').whereNotNull('spedy_invoice_id')
    if (invoices.length !== ids.length) {
      throw new BadRequestException('Há notas indisponíveis, não autorizadas ou de outra empresa na seleção.', 400, 'spedy_export_invoices_invalid')
    }
    const job = await SpedyNfseExportJob.create({
      companiesId,
      userId: user.id,
      format: format as 'xml' | 'pdf',
      status: 'queued',
      total: ids.length,
      processed: 0,
      invoiceIds: JSON.stringify(ids),
      failures: '[]',
    })
    enqueueExport(job.id)
    return { id: job.id, status: job.status, total: job.total, processed: job.processed }
  }

  private async getExportJob(user: any, jobId: string) {
    const job = await SpedyNfseExportJob.query().where('id', jobId).where('user_id', user.id).firstOrFail()
    if (!user.superuser && job.companiesId !== user.companies_id) {
      throw new BadRequestException('Lote indisponível para esta empresa.', 403, 'spedy_export_forbidden')
    }
    if (['queued', 'processing'].includes(job.status)
      && job.updatedAt < DateTime.now().minus({ minutes: 30 })) {
      job.status = 'failed'
      job.errorMessage = 'O processamento foi interrompido. Solicite um novo lote.'
      await job.save()
    }
    return job
  }

  public async exportStatus({ auth, params }: HttpContextContract) {
    const user = await this.authenticateWithPermission(auth)
    const job = await this.getExportJob(user, params.jobId)
    return {
      id: job.id, status: job.status, format: job.format,
      total: job.total, processed: job.processed,
      failures: JSON.parse(job.failures || '[]'), errorMessage: job.errorMessage,
    }
  }

  public async downloadExport({ auth, params, response }: HttpContextContract) {
    const user = await this.authenticateWithPermission(auth)
    const job = await this.getExportJob(user, params.jobId)
    if (job.status !== 'completed') {
      throw new BadRequestException('O ZIP ainda não está disponível.', 400, 'spedy_export_not_ready')
    }
    if (job.createdAt < DateTime.now().minus({ hours: 24 })) {
      throw new BadRequestException('O ZIP expirou. Solicite um novo lote.', 404, 'spedy_export_expired')
    }
    try {
      await fs.access(exportPath(job.id))
    } catch {
      throw new BadRequestException('O ZIP expirou. Solicite um novo lote.', 404, 'spedy_export_expired')
    }
    response.header('Content-Type', 'application/zip')
    return response.attachment(exportPath(job.id), job.fileName || `nfse-${job.id}.zip`)
  }

  public async show({ auth, params }: HttpContextContract) {
    const user = await this.authenticateWithPermission(auth)
    const local = await this.getLocalInvoice(user, params.id)
    return { ...local.serialize(), processingHistory: local.getProcessingHistory() }
  }

  public async sync({ auth, params, request }: HttpContextContract) {
    const user = await this.authenticateWithPermission(auth)
    if (request.input('skipAuthorized') === true) {
      const current = await this.getLocalInvoice(user, params.id)
      if (current.status === 'authorized') return current
    }
    const { local, integration } = await this.getDownloadContext(user, params.id)
    const remote = await this.spedy.getServiceInvoice(integration, local.spedyInvoiceId!)
    return SpedyServiceInvoice.saveWithHistory(this.normalizeInvoice(remote), 'sync', local.id)
  }

  public async cancel({ auth, params, request }: HttpContextContract) {
    const user = await this.authenticateWithPermission(auth)
    const justification = String(
      request.input('justification') || request.input('reason') || request.input('Reason') || ''
    ).trim()

    if (!justification) {
      throw new BadRequestException('Informe a justificativa do cancelamento', 400, 'spedy_cancel_justification_required')
    }

    if (justification.length < 15) {
      throw new BadRequestException('A justificativa do cancelamento deve ter pelo menos 15 caracteres', 400, 'spedy_cancel_justification_min_length')
    }

    const { local, integration } = await this.getDownloadContext(user, params.id)
    await this.spedy.cancelServiceInvoice(integration, local.spedyInvoiceId!, justification)
    const remote = await this.spedy.getServiceInvoice(integration, local.spedyInvoiceId!)
    return SpedyServiceInvoice.saveWithHistory(this.normalizeInvoice(remote), 'cancellation', local.id)
  }

  public async issue({ auth, params }: HttpContextContract) {
    const user = await this.authenticateWithPermission(auth)
    const { local, integration } = await this.getDownloadContext(user, params.id)
    await this.spedy.issueServiceInvoice(integration, local.spedyInvoiceId!)
    const remote = await this.spedy.getServiceInvoice(integration, local.spedyInvoiceId!)
    return SpedyServiceInvoice.saveWithHistory(this.normalizeInvoice(remote), 'reissue', local.id)
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
