import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { verifyPermission } from 'App/Services/util'

const CRM_PERMISSION_ID = 47

export default class CrmPermission {
  public async handle({ auth, response }: HttpContextContract, next: () => Promise<void>) {
    const user = await auth.use('api').authenticate()

    const permissions = auth.use('api').token?.meta.payload.permissions
    if (!verifyPermission(Boolean(user.superuser), permissions, CRM_PERMISSION_ID)) {
      return response.forbidden({
        code: 'crm_access_denied',
        message: 'Usuário sem permissão para acessar o CRM.',
      })
    }

    await next()
  }
}
