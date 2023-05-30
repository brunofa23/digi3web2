import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'
import BadRequest from 'App/Exceptions/BadRequestException'
import validations from 'App/Services/Validations/validations'


const { Logtail } = require("@logtail/node");
const logtail = new Logtail("2QyWC3ehQAWeC6343xpMSjTQ");

export default class AuthenticationController {

  public async login({ auth, request, response }: HttpContextContract) {

    const username = request.input('username')
    const shortname = request.input('shortname')
    const password = request.input('password')

    const user = await User
      .query()
      .preload('company')
      .where('username', username)
      .whereHas('company', builder => {
        builder.where('shortname', shortname)
      })
      .first()

    if (!user) {
      //const errorValidation = await new validations().validations('user_error_104')
      const errorValidation = await new validations('user_error_104')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    // Verify password
    if (!(await Hash.verify(user.password, password))) {
      let errorValidation = await new validations('user_error_105')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    // Generate token
    const token = await auth.use('api').generate(user, {
      expiresIn: '30 days',
      name: 'For the CLI app'

    })
    console.log(">>>Fez login...", { token });
    logtail.debug("debug", { token, user })
    logtail.flush()

    //return { token, user }
    return response.status(200).send({ token, user })

  }


  public async logout({ auth }: HttpContextContract) {

    await auth.use('api').revoke()
    return { revoked: true }

  }



}

