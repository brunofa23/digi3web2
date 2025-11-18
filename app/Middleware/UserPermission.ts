import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import validations from 'App/Services/Validations/validations'
import BadRequest from 'App/Exceptions/BadRequestException'
import { verifyPermission } from 'App/Services/util'

export default class UserPermission {
  public async handle({ auth }: HttpContextContract, next: () => Promise<void>, customGuards: (keyof GuardsList)[]) {

    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions

    for (const guard of customGuards) {

      if (guard === 'get') {
        await next()
        return
      }
      else if (guard === 'post' && authenticate.superuser) {
        await next()
        return
      }
      else if (guard === 'patch' && authenticate.superuser) {
        await next()
        return
      }
     
      else {
        let errorValidation = await new validations('error_10')
        throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
      }
    }

  }
}

