import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'
import BadRequest from 'App/Exceptions/BadRequestException'
import validations from 'App/Services/Validations/validations'
import { DateTime } from 'luxon'
import { verifyPermission } from 'App/Services/util'
import Groupxpermission from 'App/Models/Groupxpermission'

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
    //VERIFICAR HORARIO DISPONÍVEL
    if (!verifyPermission(user.superuser, permissions, 31)) {

      const now = DateTime.now().setZone('America/Sao_Paulo');
      const hourNow = now.hour
      const minuteNow = now.minute
      const estaNoHorarioPermitido = hourNow >= 7 && (hourNow < 19 || (hourNow === 19 && minuteNow === 0));
      if (!estaNoHorarioPermitido) {
        const errorValidation = await new validations('user_error_208')
        throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)

      }
    }

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

    try {
      // 1. Buscar o usuário que está sendo autorizado
      const user = await User
        .query()
        .where('username', usernameAutorization)
        .andWhere('companies_id', companies_id)
        .first()

      if (!user) {
        const errorValidation = await new validations('user_error_205')
        throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
      }

      // 2. Verificar a senha do usuário
      const isPasswordValid = await Hash.verify(user.password, String(password))
      if (!isPasswordValid) {
        const errorValidation = await new validations('user_error_206')
        throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
      }

      // 3. Verificar autorização (permGroup 30 ou superuser = 1)
      const hasPermission = await User
        .query()
        .where('username', usernameAutorization)
        .andWhere('companies_id', companies_id)
        .join('groupxpermissions', 'users.usergroup_id', 'groupxpermissions.usergroup_id')
        .where(query => {
          query.where('groupxpermissions.permissiongroup_id', 30).orWhere('users.superuser', 1)
        })
        .select('users.id')
        .first()

      if (!hasPermission) {
        const errorValidation = await new validations('user_error_201')
        throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
      }

      // 4. Atualizar o acesso à imagem do usuário autenticado
      const limitDataAccess = DateTime.local().plus(accessImage > 0 ? { days: accessImage } : { minutes: 7 }).toFormat('yyyy-MM-dd HH:mm')

      const authenticatedUser = await User
        .query()
        .where('username', username)
        .andWhere('companies_id', companies_id)
        .first()

      if (authenticatedUser) {
        authenticatedUser.access_image = limitDataAccess
        await authenticatedUser.save()
        return response.status(201).send({ valor: true, tempo: accessImage })
      } else {
        throw new BadRequest("Usuário autenticado não encontrado.")
      }

    } catch (error) {
      console.error("Erro:", error)
      const defaultError = await new validations('user_error_999') // erro genérico se quiser
      return response.badRequest({
        message: error.messages || defaultError.messages,
        code: error.code || defaultError.code,
        status: error.status || 400
      })
    }
  }


}

