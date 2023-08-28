import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Token from 'App/Models/Token'

export default class TokensController {

    //*****MODELO DE INSERÇÃO DO TOKEN */
    // {
    //     "id": "1",
    //     "name": "tokenGoogle",
    //     "credentials": "{\"web\":{\"client_id\": \"978830289909-q6jl9jj60afudibmtooj8bt8bt3s2kuu.apps.googleusercontent.com\",\"project_id\": \"digi3web\",\"auth_uri\": \"https://accounts.google.com/o/oauth2/auth\",\"token_uri\":\"https://oauth2.googleapis.com/token\",\"auth_provider_x509_cert_url\": \"https://www.googleapis.com/oauth2/v1/certs\",\"client_secret\": \"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\",\"redirect_uris\": [\"http://localhost:3334/oauth2callback\",\"http://localhost:3335/oauth2callback\"],\"javascript_origins\": [\"http://localhost\",\"http://localhost:3334\",\"http://localhost:3335\"]}}",
    //     "accountname": "digi3@gmail.com",
    //     "status": 1
    //   }

    public async store({ auth, response, request }: HttpContextContract) {
        const authenticate = await auth.use('api').authenticate()
        const data = request.only(Token.fillable)
        if (authenticate.companies_id == 1 && authenticate.superuser == true) {
            try {
                const searchPayload = { name: data.name }
                const persistancePayload = data
                await Token.updateOrCreate(searchPayload, persistancePayload)
                return response.status(200).send("salvo")
            } catch (error) {
                throw error
                //throw new BadRequest('Bad Request', 401, 'erro')
            }
        }
        else return "não liberado"
    }


    // public async index({ auth, response, request }) {

    //     await auth.use('api').authenticate()
    //     try {
    //         const token = await Token.findBy('name', 'tokenGoogle')
    //         return response.status(200).send(token)
    //     } catch (error) {
    //         throw error
    //         //throw new BadRequest('Bad Request', 401, 'erro')
    //     }

    // }
}
