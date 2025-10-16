import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Documenttype from 'App/Models/Documenttype'
import BadRequest from 'App/Exceptions/BadRequestException'
export default class DocumentTypesController {

  public async index({ auth, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    try {
      const documentType = await Documenttype.query()
        .where('companies_id', authenticate.companies_id)
      return response.status(200).send(documentType)
    } catch (error) {
      throw new BadRequest('Bad Request', 401, 'erro')
    }

  }




}
