import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import validations from 'App/Services/Validations/validations'
import BadRequest from 'App/Exceptions/BadRequestException'
import Groupxpermission from 'App/Models/Groupxpermission'

export default class BookRecordPermission {
  public async handle({ auth, response }: HttpContextContract, next: () => Promise<void>, customGuards: (keyof GuardsList)[]) {
    // const authenticate = await auth.use('api').authenticate()

    // const payload = auth.use('api').authenticationAttempted
    // console.log(payload) // <-- Deve funcionar aqui


    // const groupXPermissions = await Groupxpermission.query()
    //   .where('usergroup_id', authenticate.usergroup_id)
    //   .select('permissiongroup_id')
    // console.log("AUTENTICATE:", authenticate)
    // console.log("PASSEI NO MIDDLEWARE")

    // for (const guard of customGuards) {
    //   if (guard === 'fastfind') {
    //     console.log("pesquisa Rápida....")
    //     await next()
    //     return
    //   }
    //   if (guard === 'get' && authenticate.permission_level >= 0) {
    //     console.log("GET...")
    //     await next()
    //   }
    //   else
    //     if (guard === 'post' && (authenticate.permission_level >= 3 || authenticate.superuser)) {
    //       console.log("POST...")
    //       await next()
    //     }
    //     else
    //       if (guard === 'patch' && (authenticate.permission_level >= 3 || authenticate.superuser)) {
    //         await next()
    //       }
    //       else
    //         if (guard === 'destroy' && (authenticate.permission_level >= 4 || authenticate.superuser)) {
    //           await next()
    //         }
    //         else
    //           if (guard === 'generateOrUpdateBookrecords' && (authenticate.permission_level >= 4 || authenticate.superuser)) {
    //             await next()
    //           }
    //           else
    //             if (guard === 'createorupdatebookrecords' && (authenticate.permission_level >= 3 || authenticate.superuser)) {
    //               await next()
    //             }
    //             else
    //               if (guard === 'destroyManyBookRecords' && (authenticate.permission_level >= 6 || authenticate.superuser)) {
    //                 await next()
    //               }
    //               else
    //                 if (guard === 'indeximagesinitial' && (authenticate.permission_level >= 4 || authenticate.superuser)) {
    //                   await next()
    //                 }
    //                 else {
    //                   let errorValidation = await new validations('error_10')
    //                   throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    //                 }
    // }

  }
}

