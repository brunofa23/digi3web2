import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Document from 'App/Models/Document'
import BadRequestException from 'App/Exceptions/BadRequestException'
import { DateTime } from 'luxon'


export default class DocumentsController {


    public async index({ auth, request, params, response }: HttpContextContract) {
        const authenticate = await auth.use('api').authenticate()
        const documentPayload = request.only(Document.fillable)
        return "documentPayload"
    }


    public async store({ auth, request, params, response }: HttpContextContract) {
        const authenticate = await auth.use('api').authenticate()
        const documentPayload = request.only(Document.fillable)
        documentPayload.companies_id = authenticate.companies_id
        //documentPayload.datefield1 = DateTime.local().toFormat('yyyy-MM-dd HH:mm')

        try {
            console.log("data::", documentPayload)
            const data = await Document.create(documentPayload)

            return response.status(201).send(data)
        } catch (error) {
            return error
            //throw new BadRequestException('Bad Request', 401, error)
        }

    }



}
