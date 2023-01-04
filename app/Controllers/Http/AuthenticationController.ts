import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'

export default class AuthenticationController {


  public async login({ auth, request, response }: HttpContextContract) {

    const username = request.input('username')
    const shortname = request.input('shortname')
    const password = request.input('password')

    const user = await User
      .query()
      .select('users.*')
      .preload('company')
      .join('companies', `companies_id`, '=', 'companies.id')
      .where('username', username)
      .andWhere('companies.shortname', shortname)
      .firstOrFail()

    // Verify password
    if (!(await Hash.verify(user.password, password))) {
      return response.unauthorized('Invalid credentials')
    }

     // Generate token
    const token = await auth.use('api').generate(user, {
      expiresIn: '30 mins'
    })
    return token

  }


  public async logout({ auth, response }: HttpContextContract) {

    await auth.use('api').revoke()
    return {
      revoked: true
    }

  }







}
