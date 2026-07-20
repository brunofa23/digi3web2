import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import CompanyFiscalIntegration from 'App/Models/CompanyFiscalIntegration'
import SpedyNfseService from 'App/Services/Fiscal/SpedyNfseService'

export default class NfseCitiesController {
  public async index({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const config = await CompanyFiscalIntegration
      .query()
      .where('companies_id', authenticate.companies_id)
      .where('provider', 'spedy')
      .where('enabled', true)
      .first()

    if (!config) {
      throw new BadRequestException('Integração Spedy NFS-e não configurada para esta empresa', 400, 'nfse_config_missing')
    }

    const data = await new SpedyNfseService().listCities(config, request.qs())
    return response.status(200).send(data)
  }
}
