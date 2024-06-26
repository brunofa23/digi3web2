//import { GuardsList } from '@ioc:Adonis/Addons/Auth'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import validations from 'App/Services/Validations/validations'
import BadRequest from 'App/Exceptions/BadRequestException'
export default class LevelPermission {

  public async handle({ auth, response }: HttpContextContract, next: () => Promise<void>, customGuards: (keyof GuardsList)[]) {

    const authenticate = await auth.use('api').authenticate()

    if (authenticate.superuser) {
      await next()
    }
    for (const guard of customGuards) {
      if (guard === 'get')
        await next()
      else {
        let errorValidation = await new validations('error_10')
        throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
      }
    }


  }

}
