import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'
import BadRequest from 'App/Exceptions/BadRequestException'
import validations from 'App/Services/Validations/validations'
import { DateTime } from 'luxon'

export default class AuthenticationController {

  public async login({ auth, request, response }: HttpContextContract) {

    const username = request.input('username')
    const shortname = request.input('shortname')
    const password = request.input('password')
    const user = await User
      .query()
      .preload('company', query => {
        query.select('id', 'name', 'shortname', 'foldername', 'cloud')
      })
      .preload('usergroup', query => {
        query.preload('groupxpermission', query => {
          query.select('usergroup_id', 'permissiongroup_id')
        })
      })
      .where('username', username)
      .whereHas('company', builder => {
        builder.where('shortname', shortname)
      })
      .first()

    if (!user) {
      const errorValidation = await new validations('user_error_205')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    // Verify password
    if (!(await Hash.verify(user.password, password))) {
      let errorValidation = await new validations('user_error_206')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    const permissions = user?.$preloaded.usergroup.$preloaded.groupxpermission || {}
    const token = await auth.use('api').generate(user, {
      expiresIn: '7 days',
      name: username,
      payload: {
        permissions: permissions.map(p => ({
          usergroup_id: p.usergroup_id,
          permissiongroup_id: p.permissiongroup_id,
        }))
      }
    })

    //console.log(">>>>token:", token.meta.payload.permissions)
    return response.status(200).send({ token, user })

  }


  public async logout({ auth }: HttpContextContract) {

    await auth.use('api').revoke()
    return { revoked: true }

  }

  public async authorizeAccessImages({ auth, request, response }) {

    const { companies_id, username } = await auth.use('api').authenticate()
    const usernameAutorization = request.input('username')
    const password = request.input('password')
    const accessImage = request.input('accessimage')

    const userAuthorization = await User
      .query()
      .where('username', usernameAutorization)
      .andWhere('companies_id', '=', companies_id)
      .first()

    if (userAuthorization) {
      if ((userAuthorization.permission_level < 3) && (!userAuthorization.superuser)) {
        const errorValidation = await new validations('user_error_201')
        throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
      }
    }

    if (!userAuthorization) {
      const errorValidation = await new validations('user_error_205')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    // Verify password
    if (!(await Hash.verify(userAuthorization.password, String(password)))) {
      let errorValidation = await new validations('user_error_206')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    try {
      const limitDataAccess = DateTime.local().plus(accessImage > 0 ? { days: accessImage } : { minutes: 7 }).toFormat('yyyy-MM-dd HH:mm')
      const user = await User.query()
        .where('username', username)
        .andWhere('companies_id', '=', companies_id)
        .first()
      if (user) {
        user.access_image = limitDataAccess
        user.save()
        return response.status(201).send({ valor: true, tempo: accessImage })
      }

    } catch (error) {
      //let errorValidation = await new validations('user_error_206')
      throw new BadRequest("Erro ao liberar o acesso.", errorValidation.status, errorValidation.code)
    }


  }

}

