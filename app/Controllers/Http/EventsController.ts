import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Event from 'App/Models/Event'
import BadRequest from 'App/Exceptions/BadRequestException'

export default class EventsController {

    public async index({ auth, response, request }) {
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
        //const authenticate = await auth.use('api').authenticate()
        const body = request.only(Event.fillable)
        //console.log("EVENTOS STORE>>", body)
        const data = await Event.create(body)
        return response.status(201).send(data)

    }


    public async update({ request, params, response }: HttpContextContract) {
        const body = request.only(Event.fillable)
        body.id = params.id
        //console.log("data>>44:", body)
        const data = await Event.findOrFail(body.id)
        body.createdAt = data.$attributes.createdAt
        await data.fill(body).save()
        return response.status(201).send(data)


    }

    public async destroy({ params, response }: HttpContextContract) {
        const data = await Event.findOrFail(params.id)
        await data.delete()
        return response.status(204).send({ message: "Excluido" })


    }


}
