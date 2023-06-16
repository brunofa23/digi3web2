import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import validations from 'App/Services/Validations/validations'
import BadRequest from 'App/Exceptions/BadRequestException'

export default class TypebookPermission {
  public async handle({ auth, response }: HttpContextContract, next: () => Promise<void>, customGuards: (keyof GuardsList)[]) {

    const authenticate = await auth.use('api').authenticate()
    console.log("gard TYPEBOOK::>>", customGuards)

    // if (authenticate.superuser || authenticate.permission_level >= 5) {
    //   await next()
    // }

    for (const guard of customGuards) {
      if (guard === 'get' && authenticate.permission_level >= 0) {
        await next()
      }
      else
        if (guard === 'post' && (authenticate.permission_level >= 4 || authenticate.superuser)) {
          await next()
        }
        else
          if (guard === 'patch' && (authenticate.permission_level >= 4 || authenticate.superuser)) {
            await next()
          }
          else
            if (guard === 'destroy' && (authenticate.permission_level >= 5 || authenticate.superuser)) {
              await next()
            }
            else {
              let errorValidation = await new validations('error_10')
              throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
            }
    }

  }
}
