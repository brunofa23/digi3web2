// app/Middleware/StampPermission.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { verifyPermission } from 'App/Services/util'

export default class StampPermission {
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

    // 👇 ID da permissão para manutenção de stamps (exemplo)
    const STAMP_MAINTENANCE_PERMISSION_ID = 34 // ajuste para o ID real no seu sistema

    // 🔓 INDEX: liberado para qualquer usuário autenticado
    if (action === 'index') {
      await next()
      return
    }

    // 🔓 SHOW: se quiser deixar liberado para todos, mantenha assim;
    // se quiser controlar, aplique verifyPermission aqui também
    if (action === 'show') {
      await next()
      return
    }

    // 🔒 CREATE/UPDATE/DELETE: exigem permissão específica

    const hasPermission = verifyPermission(
      authenticate.superuser,
      permissions,
      STAMP_MAINTENANCE_PERMISSION_ID
    )

    if (!hasPermission) {
      return response.unauthorized({
        message: 'Você não possui permissão para executar esta ação em Stamps',
      })
    }

    await next()
  }
}
