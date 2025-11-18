import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
// import validations from 'App/Services/Validations/validations'
// import BadRequest from 'App/Exceptions/BadRequestException'
// import Groupxpermission from 'App/Models/Groupxpermission'
import { verifyPermission } from 'App/Services/util'

export default class BookRecordPermission {
  public async handle({ auth }: HttpContextContract, next: () => Promise<void>, customGuards: (keyof GuardsList)[]) {
    const authenticate = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions


    for (const guard of customGuards) {
      if (guard === 'get') {
        await next()
      }
      //if (guard === 'fastfind' && permissions.some(item => item.permissiongroup_id === 1)) {
      if (guard === 'fastfind' && verifyPermission(authenticate.superuser, permissions, 1)) {
        await next()
        return
      }
      if (guard === 'post' && verifyPermission(authenticate.superuser, permissions, 22)) {
        await next()
        return
      }
      if (guard === 'destroy' && verifyPermission(authenticate.superuser, permissions, 20)) {
        await next()
        return
      }
      if (guard === 'destroyManyBookRecords' && verifyPermission(authenticate.superuser, permissions, 20)) {
        await next()
        return
      }
      if ((guard === 'generateOrUpdateBookrecords2' || guard === 'createorupdatebookrecords' || guard === 'generateOrUpdateBookrecords')
        && verifyPermission(authenticate.superuser, permissions, 21)) {
        await next()
        return
      }

    }



  }
}

