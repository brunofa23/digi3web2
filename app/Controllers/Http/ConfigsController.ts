import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Config from 'App/Models/Config'
import Encryption from '@ioc:Adonis/Core/Encryption'


export default class ConfigsController {


    public async storeEncryption({ auth, response, request }: HttpContextContract) {

        const authenticate = await auth.use('api').authenticate()
        const data = request.only(Config.fillable)
        data.valuetext = Encryption.encrypt(data.valuetext)

        // const encrypted = Encryption.encrypt('hello-world')
        // const decrypted = Encryption.decrypt('rr0M7G61qOI1eIkfJmwEoclcbDobl8S3t4CXTjRGXfKo.eE1PSEJnY25Vdi1WNVBCTg.lli72roizZzZuVL6Z3QnmWvvC-3sSbtMHbczHjRgPN8')
        //return { encrypted, decrypted }

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
