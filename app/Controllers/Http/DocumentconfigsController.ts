import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequest from 'App/Exceptions/BadRequestException'
import DocumentConfig from 'App/Models/DocumentConfig'

export default class DocumentconfigsController {

    public async index({ auth, request, response }: HttpContextContract) {
        const authenticate = await auth.use('api').authenticate()
        const { typebooks_id } = request.only(['typebooks_id'])
        let query = "1=1"
        if (typebooks_id)
            query += ` and typebooks_id=${typebooks_id}`
        try {
            const docConfig = await DocumentConfig.query()
                .where('companies_id', authenticate.companies_id)
                .whereRaw(query)
            return response.status(200).send(docConfig)
        } catch (error) {
            throw new BadRequest('Bad Request', 401, 'erro')
        }
    }


    public async show({ auth, params, request, response }: HttpContextContract) {
        const authenticate = await auth.use('api').authenticate()
        try {
            const docConfig = await DocumentConfig.find(params.id)
            return response.status(200).send(docConfig)
        } catch (error) {
            throw new BadRequest('Erro', 401, error)

        }
    }


    public async update({ auth, request, params, response }: HttpContextContract) {
        const authenticate = await auth.use('api').authenticate()
        const payLoad = request.only(DocumentConfig.fillable)
        try {
            const documentconfig =
                await DocumentConfig.query().where('id', params.id).update(payLoad)
            return response.status(201).send(documentconfig)
        } catch (error) {
            throw new BadRequest('Bad Request - update', 401, error)
        }
    }







}
