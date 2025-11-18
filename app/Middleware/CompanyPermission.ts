import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import validations from 'App/Services/Validations/validations'
import BadRequest from 'App/Exceptions/BadRequestException'

export default class CompanyPermission {
  public async handle(
    { auth }: HttpContextContract,
    next: () => Promise<void>,
    customGuards: string[]   // aqui não é GuardsList, é string normal
  ) {

    const user = await auth.use('api').authenticate()

    let allowed = false

    for (const guard of customGuards) {

      if (guard === 'get' && user.permission_level >= 0) {
        allowed = true
        break
      }

      if (guard === 'post' && user.superuser) {
        allowed = true
        break
      }

      if (guard === 'patch' && user.superuser) {
        allowed = true
        break
      }

      if (guard === 'destroy' && user.superuser) {
        allowed = true
        break
      }
    }

    // se NENHUM guard permitiu → lança exceção
    if (!allowed) {
      let errorValidation = await new validations('error_10')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    // só executa next() uma vez, e somente se a permissão foi validada
    await next()
  }
}






// export default class CompanyPermission {
//   public async handle({ auth }: HttpContextContract, next: () => Promise<void>, customGuards: (keyof GuardsList)[]) {

//     const authenticate = await auth.use('api').authenticate()


//     for (const guard of customGuards) {
//       if (guard === 'get' && authenticate.permission_level >= 0) {
//         await next()
//       }
//       else
//         if (guard === 'post' && authenticate.superuser) {
//           await next()
//         }
//         else
//           if (guard === 'patch' && authenticate.superuser) {
//             await next()
//           }
//           else
//             if (guard === 'destroy' && authenticate.superuser) {
//               await next()
//             }
//             else {
//               let errorValidation = await new validations('error_10')
//               throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
//             }
//     }

//   }
// }
