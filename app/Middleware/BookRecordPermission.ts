import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { verifyPermission } from 'App/Services/util'
import type { GuardsList } from '@ioc:Adonis/Addons/Auth'

export default class BookRecordPermission {
  public async handle(
    { auth, response }: HttpContextContract,
    next: () => Promise<void>,
    customGuards: (keyof GuardsList)[]
  ) {
    const user = await auth.use('api').authenticate()
    const permissions = auth.use('api').token?.meta.payload.permissions || []

    let allowed = false

    for (const guard of customGuards) {
      if (guard === 'get') {
        allowed = true
        break
      }

      if (guard === 'fastfind' && verifyPermission(user.superuser, permissions, 1)) {
        allowed = true
        break
      }

      if (guard === 'post' && verifyPermission(user.superuser, permissions, 22)) {
        allowed = true
        break
      }

      if (guard === 'destroy' && verifyPermission(user.superuser, permissions, 20)) {
        allowed = true
        break
      }

      if (guard === 'destroyManyBookRecords' && verifyPermission(user.superuser, permissions, 20)) {
        allowed = true
        break
      }

      if (
        (guard === 'generateOrUpdateBookrecords2' ||
          guard === 'createorupdatebookrecords' ||
          guard === 'generateOrUpdateBookrecords') &&
        verifyPermission(user.superuser, permissions, 21)
      ) {
        allowed = true
        break
      }
    }

    if (!allowed) {
      // aqui você BARRA a requisição
      return response.unauthorized({
        error: 'Você não tem permissão para executar esta ação.',
      })
      // ou: return response.forbidden({ ... }) se fizer mais sentido (403)
    }

    // se passou nas permissões, segue o fluxo
    await next()
  }
}

// export default class BookRecordPermission {
//   public async handle({ auth }: HttpContextContract, next: () => Promise<void>, customGuards: (keyof GuardsList)[]) {
//     const authenticate = await auth.use('api').authenticate()
//     const permissions = auth.use('api').token?.meta.payload.permissions


//     for (const guard of customGuards) {
//       if (guard === 'get') {
//         await next()
//       }
//       //if (guard === 'fastfind' && permissions.some(item => item.permissiongroup_id === 1)) {
//       if (guard === 'fastfind' && verifyPermission(authenticate.superuser, permissions, 1)) {
//         await next()
//         return
//       }
//       if (guard === 'post' && verifyPermission(authenticate.superuser, permissions, 22)) {
//         await next()
//         return
//       }
//       if (guard === 'destroy' && verifyPermission(authenticate.superuser, permissions, 20)) {
//         await next()
//         return
//       }
//       if (guard === 'destroyManyBookRecords' && verifyPermission(authenticate.superuser, permissions, 20)) {
//         await next()
//         return
//       }
//       if ((guard === 'generateOrUpdateBookrecords2' || guard === 'createorupdatebookrecords' || guard === 'generateOrUpdateBookrecords')
//         && verifyPermission(authenticate.superuser, permissions, 21)) {
//         await next()
//         return
//       }

//     }



//   }
// }

