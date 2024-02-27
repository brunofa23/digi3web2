import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import validations from 'App/Services/Validations/validations'
import BadRequest from 'App/Exceptions/BadRequestException'

export default class CompanyPermission {
  public async handle({ auth }: HttpContextContract, next: () => Promise<void>, customGuards: (keyof GuardsList)[]) {

    const authenticate = await auth.use('api').authenticate()

    // if (authenticate.superuser || authenticate.permission_level >= 5) {
    //   await next()
    // }

    for (const guard of customGuards) {
      if (guard === 'get' && authenticate.permission_level >= 0) {
        await next()
      }
      else
        if (guard === 'post' && authenticate.superuser) {
          await next()
        }
        else
          if (guard === 'patch' && authenticate.superuser) {
            await next()
          }
          else
            if (guard === 'destroy' && authenticate.superuser) {
              await next()
            }
            else {
              let errorValidation = await new validations('error_10')
              throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
            }
    }

  }
}
