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

      //   if (guard === 'get' && authenticate.permission_level >= 0) {

      //     await next()
      //   }
      //   else
      //     if (guard === 'post' && (authenticate.permission_level >= 3 || authenticate.superuser)) {
      //       await next()
      //     }
      //     else
      //       if (guard === 'patch' && (authenticate.permission_level >= 3 || authenticate.superuser)) {
      //         await next()
      //       }
      //       else
      //         if (guard === 'destroy' && (authenticate.permission_level >= 5 || authenticate.superuser)) {
      //           await next()
      //         }
      //         else
      //           if (guard === 'uploads' && (authenticate.permission_level >= 3 || authenticate.superuser)) {
      //             await next()
      //           }
      //           else
      //             if (guard === 'download' && (authenticate.permission_level >= 3 || authenticate.superuser || authenticate.access_image >= DateTime.local())) {
      //               await next()
      //             }
      //             else
      //               if (guard === 'uploadCapture' && (authenticate.permission_level >= 3 || authenticate.superuser)) {
      //                 await next()
      //               }
      //               else {
      //                 let errorValidation = await new validations('error_10')
      //                 throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
      //               }

    }
  }
}
