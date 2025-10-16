import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import DocumentTypeBook from 'App/Models/DocumentTypeBook'
import BadRequest from 'App/Exceptions/BadRequestException'
export default class DocumentTypesController {

  public async index({ auth, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    try {
      const documentType = await DocumentTypeBook.query()
        .where('companies_id', authenticate.companies_id)
      return response.status(200).send(documentType)
    } catch (error) {
      throw new BadRequest('Bad Request', 401, 'erro')
    }

  }




}
