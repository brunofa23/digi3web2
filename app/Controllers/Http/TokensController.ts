import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Encryption from '@ioc:Adonis/Core/Encryption'
import Token from 'App/Models/Token'

export default class TokensController {

    public async store({ auth, response, request }: HttpContextContract) {
        const authenticate = await auth.use('api').authenticate()
        const data = request.only(Token.fillable)
        if (authenticate.companies_id == 1 && authenticate.superuser == true) {

            try {
                const searchPayload = { name: data.name }
                const persistancePayload = data//{ password: 'secret' }
                await Token.updateOrCreate(searchPayload, persistancePayload)
                return response.status(200).send("salvo")
            } catch (error) {
                //throw new BadRequest('Bad Request', 401, 'erro')
            }
        }
        else return "não liberado"
    }


    public async index({ auth, response, request }) {

        const authenticate = await auth.use('api').authenticate()

        try {
            const token = await Token.findBy('name', 'tokenGoogle')

            return response.status(200).send(token)
        } catch (error) {
            //throw new BadRequest('Bad Request', 401, 'erro')
        }

    }




}
