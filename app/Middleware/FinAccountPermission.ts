import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { verifyPermission } from 'App/Services/util'

export default class FinAccountPermission {
  public async handle({ auth }: HttpContextContract, next: () => Promise<void>, customGuards: (keyof GuardsList)[]) {
    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions
    const action = customGuards[0] // 'get', 'show', 'create', 'update'

    if (action === 'get' && verifyPermission(authenticate.superuser, permissions, 33)) {
      await next()
      return
    }

    await next()
  }
}
