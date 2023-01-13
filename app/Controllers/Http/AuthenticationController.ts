import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'
import Database from '@ioc:Adonis/Lucid/Database'
import Company from 'App/Models/Company'

export default class AuthenticationController {


  public async login({ auth, request, response }: HttpContextContract) {

    const username = request.input('username')
    const shortname = request.input('shortname')
    const password = request.input('password')

    const user = await User
      .query()

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
      expiresIn: '30 days',
      name: 'For the CLI app'

    })
    console.log(token);

    return {token, user}

  }


  public async logout({ auth, response }:HttpContextContract) {

    await auth.use('api').revoke()
    return {
      revoked: true
    }

  }



}

