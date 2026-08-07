import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import validations from 'App/Services/Validations/validations'
import BadRequest from 'App/Exceptions/BadRequestException'
import { verifyPermission } from 'App/Services/util'

export default class UserPermission {
  private usersPermissiongroupId = 5

  public async handle({ auth }: HttpContextContract, next: () => Promise<void>, customGuards: string[]) {

    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions

    for (const guard of customGuards) {

      if (guard === 'get' && verifyPermission(Boolean(authenticate.superuser), permissions, this.usersPermissiongroupId)) {
        await next()
        return
      }
      else if (guard === 'post' && verifyPermission(Boolean(authenticate.superuser), permissions, this.usersPermissiongroupId)) {
        await next()
        return
      }
      else if (guard === 'patch' && verifyPermission(Boolean(authenticate.superuser), permissions, this.usersPermissiongroupId)) {
        await next()
        return
      }
     
      else {
        let errorValidation: any = await new validations('error_10')
        throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
      }
    }

  }
}
