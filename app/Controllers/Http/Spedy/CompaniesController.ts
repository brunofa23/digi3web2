import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Company from 'App/Models/Company'
import CompanySpedyIntegration from 'App/Models/CompanySpedyIntegration'
import SpedyCompaniesService from 'App/Services/Spedy/SpedyCompaniesService'
import CompanySpedyIntegrationValidator from 'App/Validators/Spedy/CompanySpedyIntegrationValidator'
import SpedyCompanyValidator from 'App/Validators/Spedy/SpedyCompanyValidator'
import SpedyCompanySettingsValidator from 'App/Validators/Spedy/SpedyCompanySettingsValidator'
import { verifyPermission } from 'App/Services/util'

export default class CompaniesController {
  private spedy = new SpedyCompaniesService()
  private companyNfseSettingsPermissiongroupId = 43

  private async requireSuperuser(auth: HttpContextContract['auth']) {
    const user = await auth.use('api').authenticate()

    if (!user.superuser) {
      throw new BadRequestException('Acesso permitido somente para super usuário', 403, 'spedy_superuser_required')
    }

    return user
  }

  private async requireCompanyNfseSettingsAccess(auth: HttpContextContract['auth'], companyId?: number | string) {
    const user = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []

    if (user.superuser) return user

    if (!verifyPermission(false, permissions, this.companyNfseSettingsPermissiongroupId)) {
      throw new BadRequestException('Usuario sem permissao para configurar NFS-e da empresa.', 403, 'spedy_company_nfse_settings_forbidden')
    }

    if (companyId && Number(companyId) !== Number(user.companies_id)) {
      throw new BadRequestException('Usuario sem permissao para configurar NFS-e desta empresa.', 403, 'spedy_company_nfse_settings_company_forbidden')
    }

    return user
  }

  private async getAllowedCompanyIntegration(auth: HttpContextContract['auth'], environment: string, spedyCompanyId: string) {
    const user = await this.requireCompanyNfseSettingsAccess(auth)

    if (user.superuser) {
      return CompanySpedyIntegration
        .query()
        .where('environment', environment)
        .where('spedy_company_id', spedyCompanyId)
        .first()
    }

    const integration = await CompanySpedyIntegration
      .query()
      .where('companies_id', user.companies_id)
      .where('environment', environment)
      .where('spedy_company_id', spedyCompanyId)
      .first()

    if (!integration) {
      throw new BadRequestException('Empresa NFS-e não vinculada a empresa logada.', 403, 'spedy_company_nfse_settings_link_forbidden')
    }

    return integration
  }

  private async getOwnerIntegration(environment: string = 'sandbox') {
    const integration = await CompanySpedyIntegration
      .query()
      .where('environment', environment)
      .where('is_owner', true)
      .where('active', true)
      .first()

    if (!integration?.spedyApiKey) {
      throw new BadRequestException('Integração Spedy owner não configurada', 400, 'spedy_owner_missing')
    }

    return integration
  }

  private serializeIntegration(integration: CompanySpedyIntegration | null) {
    if (!integration) return null

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
    }
  }

  public async list({ auth, request }: HttpContextContract) {
    await this.requireSuperuser(auth)
    const environment = request.input('environment', 'sandbox')
    const owner = await this.getOwnerIntegration(environment)

    return this.spedy.listCompanies(owner, request.qs())
  }

  public async create({ auth, request }: HttpContextContract) {
    await this.requireSuperuser(auth)
    const environment = request.input('environment', 'sandbox')
    const owner = await this.getOwnerIntegration(environment)
    const payload = await request.validate(SpedyCompanyValidator)

    return this.spedy.createCompany(owner, payload)
  }

  public async show({ auth, params, request }: HttpContextContract) {
    const environment = request.input('environment', 'sandbox')
    await this.getAllowedCompanyIntegration(auth, environment, params.id)
    const owner = await this.getOwnerIntegration(environment)

    return this.spedy.getCompany(owner, params.id)
  }

  public async update({ auth, params, request }: HttpContextContract) {
    const environment = request.input('environment', 'sandbox')
    await this.getAllowedCompanyIntegration(auth, environment, params.id)
    const owner = await this.getOwnerIntegration(environment)
    const payload = await request.validate(SpedyCompanyValidator)

    return this.spedy.updateCompany(owner, params.id, payload)
  }

  public async destroy({ auth, params, request }: HttpContextContract) {
    await this.requireSuperuser(auth)
    const environment = request.input('environment', 'sandbox')
    const owner = await this.getOwnerIntegration(environment)

    return this.spedy.deleteCompany(owner, params.id)
  }

  public async settings({ auth, params, request }: HttpContextContract) {
    const environment = request.input('environment', 'sandbox')
    await this.getAllowedCompanyIntegration(auth, environment, params.id)
    const owner = await this.getOwnerIntegration(environment)

    return this.spedy.getSettings(owner, params.id)
  }

  public async updateSettings({ auth, params, request }: HttpContextContract) {
    const environment = request.input('environment', 'sandbox')
    await this.getAllowedCompanyIntegration(auth, environment, params.id)
    const owner = await this.getOwnerIntegration(environment)
    const payload = await request.validate(SpedyCompanySettingsValidator)

    return this.spedy.updateSettings(owner, params.id, payload)
  }

  public async serviceInvoiceCities({ auth, request }: HttpContextContract) {
    await this.requireCompanyNfseSettingsAccess(auth)
    const environment = request.input('environment', 'sandbox')
    const owner = await this.getOwnerIntegration(environment)

    return this.spedy.listServiceInvoiceCities(owner, request.qs())
  }

  public async certificates({ auth, params, request }: HttpContextContract) {
    const environment = request.input('environment', 'sandbox')
    await this.getAllowedCompanyIntegration(auth, environment, params.id)
    const owner = await this.getOwnerIntegration(environment)

    return this.spedy.getCertificates(owner, params.id)
  }

  public async uploadCertificate({ auth, params, request }: HttpContextContract) {
    const environment = request.input('environment', 'sandbox')
    await this.getAllowedCompanyIntegration(auth, environment, params.id)
    const owner = await this.getOwnerIntegration(environment)
    const password = request.input('password')
    const file = request.file('file', {
      extnames: ['pfx', 'p12'],
      size: '10mb',
    }) || request.file('certificateFile', {
      extnames: ['pfx', 'p12'],
      size: '10mb',
    })

    if (!password) {
      throw new BadRequestException('Informe a senha do certificado', 400, 'spedy_certificate_password_missing')
    }

    if (!file) {
      throw new BadRequestException('Informe o arquivo do certificado digital', 400, 'spedy_certificate_file_missing')
    }

    if (!file.isValid) {
      throw new BadRequestException(file.errors?.[0]?.message || 'Arquivo do certificado digital inválido', 400, 'spedy_certificate_file_invalid')
    }

    const uploadResponse = await this.spedy.uploadCertificate(owner, params.id, file, password)
    const certificates = await this.spedy.getCertificates(owner, params.id)

    return {
      uploadResponse,
      certificates,
      credentialSource: 'owner',
    }
  }

  public async showIntegration({ auth, params, request }: HttpContextContract) {
    await this.requireCompanyNfseSettingsAccess(auth, params.companyId)
    const environment = request.input('environment', 'sandbox')

    const integration = await CompanySpedyIntegration
      .query()
      .where('companies_id', params.companyId)
      .where('environment', environment)
      .first()

    return this.serializeIntegration(integration)
  }

  public async saveIntegration({ auth, params, request }: HttpContextContract) {
    const user = await this.requireCompanyNfseSettingsAccess(auth, params.companyId)
    const payload = await request.validate(CompanySpedyIntegrationValidator)
    const environment = payload.environment || 'sandbox'

    const company = await Company.find(params.companyId)

    if (!company) {
      throw new BadRequestException('Empresa local não encontrada no Digi3.', 404, 'digi3_company_not_found')
    }

    let integration = await CompanySpedyIntegration
      .query()
      .where('companies_id', params.companyId)
      .where('environment', environment)
      .first()

    if (!integration) {
      integration = new CompanySpedyIntegration()
      integration.companiesId = Number(params.companyId)
      integration.environment = environment
    }

    integration.spedyCompanyId = payload.spedyCompanyId || null
    integration.isOwner = user.superuser && payload.isOwner === true
    integration.active = payload.active !== undefined ? payload.active === true : true

    if (payload.spedyApiKey !== undefined) {
      integration.spedyApiKey = payload.spedyApiKey || null
    }

    if (payload.fetchCompany && integration.spedyCompanyId) {
      const owner = await this.getOwnerIntegration(environment)
      const remote = await this.spedy.getCompany(owner, integration.spedyCompanyId)
      integration.lastCompanySnapshot = remote
      integration.lastSyncAt = DateTime.local()
    }

    await integration.save()

    return this.serializeIntegration(integration)
  }

  public async syncIntegration({ auth, params, request }: HttpContextContract) {
    await this.requireCompanyNfseSettingsAccess(auth, params.companyId)
    const environment = request.input('environment', 'sandbox')

    const integration = await CompanySpedyIntegration
      .query()
      .where('companies_id', params.companyId)
      .where('environment', environment)
      .first()

    if (!integration) {
      throw new BadRequestException('Salve o vínculo da integração NFS-e antes de sincronizar.', 400, 'spedy_company_integration_missing')
    }

    if (!integration.spedyCompanyId) {
      throw new BadRequestException('Empresa Spedy não vinculada', 400, 'spedy_company_missing')
    }

    const owner = await this.getOwnerIntegration(environment)
    const remote = await this.spedy.getCompany(owner, integration.spedyCompanyId)

    integration.lastCompanySnapshot = remote
    integration.lastSyncAt = DateTime.local()
    await integration.save()

    return this.serializeIntegration(integration)
  }
}
