import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import validations from 'App/Services/Validations/validations'
import BadRequest from 'App/Exceptions/BadRequestException'

export default class BookRecordPermission {
  public async handle({ auth, response }: HttpContextContract, next: () => Promise<void>, customGuards: (keyof GuardsList)[]) {
    const authenticate = await auth.use('api').authenticate()
    for (const guard of customGuards) {
      if (guard === 'get' && authenticate.permission_level >= 0) {
        await next()
      }
      else
        if (guard === 'post' && (authenticate.permission_level >= 3 || authenticate.superuser)) {
          await next()
        }
        else
          if (guard === 'patch' && (authenticate.permission_level >= 3 || authenticate.superuser)) {
            await next()
          }
          else
            if (guard === 'destroy' && (authenticate.permission_level >= 4 || authenticate.superuser)) {
              await next()
            }
            else
              if (guard === 'generateOrUpdateBookrecords' && (authenticate.permission_level >= 4 || authenticate.superuser)) {
                await next()
              }
              else
                if (guard === 'createorupdatebookrecords' && (authenticate.permission_level >= 3 || authenticate.superuser)) {
                  await next()
                }
                else
                  if (guard === 'destroyManyBookRecords' && (authenticate.permission_level >= 6 || authenticate.superuser)) {
                    await next()
                  }
                  else
                    if (guard === 'indeximagesinitial' && (authenticate.permission_level >= 4 || authenticate.superuser)) {
                      await next()
                    }
                    else {
                      let errorValidation = await new validations('error_10')
                      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
                    }
    }

  }
}

