import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { verifyPermission } from 'App/Services/util'

export default class ServiceMenuPermission {
  public async handle(
    { auth, response }: HttpContextContract,
    next: () => Promise<void>,
    permissionIds: string[]
  ) {
    const user = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions

    if (!verifyPermission(Boolean(user.superuser), permissions, Number(permissionIds[0]))) {
      return response.forbidden({ message: 'Você não possui permissão para executar esta ação.' })
    }

    await next()
  }
}
