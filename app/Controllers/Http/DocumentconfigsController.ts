import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequest from 'App/Exceptions/BadRequestException'
import DocumentConfig from 'App/Models/DocumentConfig'

export default class DocumentconfigsController {

    public async index({ auth, request, response }: HttpContextContract) {
        const authenticate = await auth.use('api').authenticate()
        const { typebooks_id } = request.only(['typebooks_id'])
        console.log("teste...", typebooks_id)

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
        console.log("companie", authenticate.companies_id)
        console.log("parametr", params)
        console.log("request", request.requestData)
        try {
            const docConfig = await DocumentConfig.find(params.id)
            return response.status(200).send(docConfig)
        } catch (error) {
            throw new BadRequest('Erro', 401, error)

        }
    }


    // public async update({ auth, request, params, response }: HttpContextContract) {
    //     const authenticate = await auth.use('api').authenticate()
    //     const body = request.only(DocumentConfig.fillable)

    //     body.id = params.id
    //     body.companies_id = authenticate.companies_id
    //     body.userid = authenticate.id

    //     try {
    //         await Bookrecord.query()
    //             .where('id', '=', body.id)
    //             .andWhere('typebooks_id', '=', body.typebooks_id)
    //             .andWhere('companies_id', '=', authenticate.companies_id)
    //             .update(body)
    //         fileRename.updateFileName(body)
    //         return response.status(201).send({ body, params: params.id })
    //     } catch (error) {
    //         throw new BadRequestException('Bad Request', 401, error)
    //     }

    // }



}
