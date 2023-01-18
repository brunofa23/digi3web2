import { GuardsList } from '@ioc:Adonis/Addons/Auth'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class LevelPermission {
  public async handle({ auth, response }: HttpContextContract, next: () => Promise<void>, customGuards: (keyof GuardsList)[]) {
    
    await auth.use('api').authenticate()
    const user = auth.use('api').user

    for(const guard of customGuards) {

      if(guard === 'superuser' && !user?.superuser) {
        return response.unauthorized({ error: 'Unauthorized: su' })
      }
      
      if(!isNaN(parseInt(guard)) && user?.permission_level < parseInt(guard)) {
        return response.unauthorized({ error: 'Unauthorized: level' })
      }
    }

    await next()
  }
  
}
