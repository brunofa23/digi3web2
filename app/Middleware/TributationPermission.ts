// app/Middleware/TributationPermission.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { verifyPermission } from 'App/Services/util'

export default class TributationPermission {
  /**
   * customGuards:
   *  - 'index' | 'show' | 'create' | 'update' | 'delete'
   */
  public async handle(
    { auth, response }: HttpContextContract,
    next: () => Promise<void>,
    customGuards: string[]
  ) {
    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions
    const action = customGuards[0] as 'index' | 'show' | 'create' | 'update' | 'delete'

    // 👇 ID da permissão para manutenção de tributações (ajuste para o ID real)
    const TRIBUTATION_MAINTENANCE_PERMISSION_ID = 35 // exemplo

    // 🔓 INDEX: liberado para qualquer usuário autenticado
    if (action === 'index') {
      await next()
      return
    }

    // 🔓 SHOW: se quiser deixar livre, mantém assim; se quiser travar, tire esse bloco
    if (action === 'show') {
      await next()
      return
    }

    // 🔒 CREATE/UPDATE/DELETE: exigem permissão específica
    const hasPermission = verifyPermission(
      authenticate.superuser,
      permissions,
      TRIBUTATION_MAINTENANCE_PERMISSION_ID
    )

    if (!hasPermission) {
      return response.forbidden({
        message: 'Você não possui permissão para executar esta ação em Tributações',
      })
    }

    await next()
  }
}
