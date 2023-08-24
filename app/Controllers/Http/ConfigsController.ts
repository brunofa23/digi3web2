import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Config from 'App/Models/Config'

export default class ConfigsController {


    public async store({ auth, response, request }: HttpContextContract) {

        const authenticate = await auth.use('api').authenticate()
        const data = request.only(Config.fillable)

        if (authenticate.companies_id == 1 && authenticate.superuser == true) {
            try {

                const searchPayload = { name: data.name }
                const persistancePayload = data//{ password: 'secret' }
                await Config.updateOrCreate(searchPayload, persistancePayload)
                return response.status(200).send("salvo")
            } catch (error) {
                //throw new BadRequest('Bad Request', 401, 'erro')
            }
        }
        else return "não liberado"



    }



}
