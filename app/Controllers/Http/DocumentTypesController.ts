import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Documenttype from 'App/Models/Documenttype'
import BadRequest from 'App/Exceptions/BadRequestException'
export default class DocumentTypesController {

  public async index({ auth, response, request }: HttpContextContract) {
    //const authenticate = await auth.use('api').authenticate()

    console.log("código 566")

    try {
        const documentType = await Documenttype.query()
        return response.status(200).send(documentType)
    } catch (error) {
        throw new BadRequest('Bad Request', 401, 'erro')
    }

}




}
