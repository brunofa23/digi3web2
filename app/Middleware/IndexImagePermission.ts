import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import validations from 'App/Services/Validations/validations'
import BadRequest from 'App/Exceptions/BadRequestException'
import { DateTime } from 'luxon'
import { verifyPermission } from 'App/Services/util'

export default class IndexImagePermission {
  public async handle({ auth }: HttpContextContract, next: () => Promise<void>, customGuards: (keyof GuardsList)[]) {

    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions

    for (const guard of customGuards) {
      if (guard === 'get') {
        await next()
      }
      if (guard === 'post') {
        await next()
        return
      }
      if (guard === 'patch') {
        await next()
      }
      if (guard === 'destroy' && verifyPermission(authenticate.superuser, permissions, 32)) {
        await next()
        return
      }

      

    }
  }
}
