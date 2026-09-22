import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'

const CRM_PERMISSION_ID = 47

export default class CrmPermission {
  public async handle({ auth, response }: HttpContextContract, next: () => Promise<void>) {
    const user = await auth.use('api').authenticate()

    if (user.superuser) {
      await next()
      return
    }

    const permission = await Database.from('groupxpermissions')
      .where('usergroup_id', user.usergroup_id)
      .where('companies_id', user.companies_id)
      .where('permissiongroup_id', CRM_PERMISSION_ID)
      .first()

    if (!permission) {
      return response.forbidden({
        code: 'crm_access_denied',
        message: 'Usuário sem permissão para acessar o CRM.',
      })
    }

    await next()
  }
}
