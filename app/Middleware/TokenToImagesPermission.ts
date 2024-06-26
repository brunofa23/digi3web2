import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequest from 'App/Exceptions/BadRequestException'
import validations from 'App/Services/Validations/validations'

export default class TokenToImagesPermission {
  public async handle({ auth }: HttpContextContract, next: () => Promise<void>, customGuards: (keyof GuardsList)[]) {
    // code for middleware goes here. ABOVE THE NEXT CALL
    const authenticate = await auth.use('api').authenticate()

       for (const guard of customGuards) {

        if (guard === 'post' && (authenticate.permission_level >= 4 || authenticate.superuser)) {
          await next()
        }
          else {
            let errorValidation = await new validations('user_error_201')
            throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
          }
    }



//****************************************************** */
  }
}
