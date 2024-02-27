import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Eventtype from 'App/Models/Eventtype'

export default class EventtypesController {

    public async index({ auth, response }: HttpContextContract) {
        const authenticate = await auth.use('api').authenticate()
        const data = await Eventtype.query()

        return response.status(200).send(data)

    }


}
