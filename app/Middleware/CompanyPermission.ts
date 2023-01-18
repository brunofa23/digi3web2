import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CompanyPermission {
  public async handle({ auth, response, params }: HttpContextContract, next: () => Promise<void>) {
    
    await auth.use('api').authenticate()
    const user = auth.use('api').user
    const { company_id } = params
    
    if(user.superuser || !company_id)  {
      await next()
    } else {
      if(company_id != user?.companies_id) return response.unauthorized({ error: 'Unauthorized: company_id' })
      await next()
    }
    
  }
}
