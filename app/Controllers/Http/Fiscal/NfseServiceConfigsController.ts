import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Service from 'App/Models/Service'
import ServiceFiscalConfig from 'App/Models/ServiceFiscalConfig'
import ServiceFiscalConfigValidator from 'App/Validators/Fiscal/ServiceFiscalConfigValidator'

export default class NfseServiceConfigsController {
  private async ensureService(companiesId: number, serviceId: number) {
    const service = await Service
      .query()
      .where('companies_id', companiesId)
      .where('id', serviceId)
      .first()

    if (!service) {
      throw new BadRequestException('Serviço inválido para a empresa logada', 400, 'nfse_service_invalid')
    }
  }

  public async index({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const serviceId = request.input('serviceId')

    const query = ServiceFiscalConfig
      .query()
      .where('companies_id', authenticate.companies_id)
      .preload('service')
      .orderBy('id', 'desc')

    if (serviceId) query.where('service_id', serviceId)

    const data = await query
    return response.status(200).send(data)
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const payload = await request.validate(ServiceFiscalConfigValidator)

    await this.ensureService(authenticate.companies_id, payload.serviceId)

    let config = await ServiceFiscalConfig
      .query()
      .where('companies_id', authenticate.companies_id)
      .where('service_id', payload.serviceId)
      .first()

    if (!config) {
      config = new ServiceFiscalConfig()
      config.companiesId = authenticate.companies_id
      config.serviceId = payload.serviceId
    }

    config.merge({
      federalServiceCode: payload.federalServiceCode || null,
      cityServiceCode: payload.cityServiceCode || null,
      nbsCode: payload.nbsCode || null,
      taxationType: payload.taxationType || null,
      issRate: payload.issRate || null,
      issWithheld: payload.issWithheld ?? false,
      descriptionTemplate: payload.descriptionTemplate || null,
      enabled: payload.enabled ?? true,
    })

    await config.save()
    await config.load('service')

    return response.status(200).send(config)
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const payload = await request.validate(ServiceFiscalConfigValidator)

    await this.ensureService(authenticate.companies_id, payload.serviceId)

    const config = await ServiceFiscalConfig
      .query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .firstOrFail()

    config.merge({
      serviceId: payload.serviceId,
      federalServiceCode: payload.federalServiceCode || null,
      cityServiceCode: payload.cityServiceCode || null,
      nbsCode: payload.nbsCode || null,
      taxationType: payload.taxationType || null,
      issRate: payload.issRate || null,
      issWithheld: payload.issWithheld ?? false,
      descriptionTemplate: payload.descriptionTemplate || null,
      enabled: payload.enabled ?? true,
    })

    await config.save()
    await config.load('service')

    return response.status(200).send(config)
  }
}
