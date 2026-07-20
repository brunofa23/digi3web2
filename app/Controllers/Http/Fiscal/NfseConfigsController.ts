import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import CompanyFiscalIntegration from 'App/Models/CompanyFiscalIntegration'
import NfseConfigValidator from 'App/Validators/Fiscal/NfseConfigValidator'

export default class NfseConfigsController {
  public async show({ auth, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const config = await CompanyFiscalIntegration
      .query()
      .where('companies_id', authenticate.companies_id)
      .where('provider', 'spedy')
      .first()

    return response.status(200).send(config || null)
  }

  public async update({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const payload = await request.validate(NfseConfigValidator)

    let config = await CompanyFiscalIntegration
      .query()
      .where('companies_id', authenticate.companies_id)
      .where('provider', 'spedy')
      .first()

    if (!config) {
      config = new CompanyFiscalIntegration()
      config.companiesId = authenticate.companies_id
      config.provider = 'spedy'
    }

    config.merge({
      environment: payload.environment,
      spedyCompanyId: payload.spedyCompanyId || null,
      enabled: payload.enabled ?? false,
      taxRegime: payload.taxRegime || null,
      stateTaxNumber: payload.stateTaxNumber || null,
      cityTaxNumber: payload.cityTaxNumber || null,
      economicActivityCode: payload.economicActivityCode || null,
      cityIbgeCode: payload.cityIbgeCode || null,
      defaultFederalServiceCode: payload.defaultFederalServiceCode || null,
      defaultCityServiceCode: payload.defaultCityServiceCode || null,
      defaultNbsCode: payload.defaultNbsCode || null,
      defaultIssRate: payload.defaultIssRate || null,
      defaultTaxationType: payload.defaultTaxationType || null,
    })

    if (payload.spedyApiKey !== undefined) {
      config.spedyApiKey = payload.spedyApiKey || null
    }

    await config.save()

    return response.status(200).send(config)
  }
}
