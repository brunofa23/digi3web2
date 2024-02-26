import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Event from 'App/Models/Event'
import BadRequest from 'App/Exceptions/BadRequestException'

export default class EventsController {

    public async index({ auth, response, request }) {
        console.log("CHAMEI API EVENTOS...")
        const authenticate = await auth.use('api').authenticate()

        try {
            const event = await Event
                .query()
                .preload('company', query => {
                    query.select('name')
                })
                .preload('user', query => {
                    query.select('name')
                })
                .preload('eventtype', query => {
                    query.select('name')
                })
            return response.status(200).send(event)
        } catch (error) {
            throw new BadRequest('Bad Request', 401, 'erro')
        }

    }



    public async store({ request, response }: HttpContextContract) {
        const body = request.only(Event.fillable)
        response.send(body)
        const data = await Event.create(body)

        response.status(201)
        return {
            message: "Criado com sucesso",
            data: data,
        }

    }


    public async update({ request, params }: HttpContextContract) {
        const body = request.only(Event.fillable)
        body.id = params.id
        const data = await Event.findOrFail(body.id)
        await data.fill(body).save()
        return {
            message: 'Tipo de Livro alterado com sucesso!!',
            data: data,
            body: body,
            params: params.id
        }

    }

    public async destroy({ params }: HttpContextContract) {
        const data = await Book.findOrFail(params.id)

        await data.delete()

        return {
            message: "Livro excluido com sucesso.",
            data: data
        }

    }


}
