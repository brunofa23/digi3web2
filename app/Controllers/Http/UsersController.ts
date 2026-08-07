import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import BadRequest from 'App/Exceptions/BadRequestException'
import validations from 'App/Services/Validations/validations'
import UserValidator from 'App/Validators/UserValidator'
import { DateTime } from 'luxon'
import Usergroup from 'App/Models/Usergroup'

export default class UsersController {
  private parseAccessImageDate(accessImage: any) {
    if (DateTime.isDateTime(accessImage)) {
      return accessImage
    }

    if (accessImage instanceof Date) {
      return DateTime.fromJSDate(accessImage)
    }

    const accessImageText = String(accessImage)
    const accessImageSql = DateTime.fromSQL(accessImageText)

    return accessImageSql.isValid ? accessImageSql : DateTime.fromISO(accessImageText)
  }

  public async index({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const { companies_id, findCompany, findUser, findSuperuser } = request.only(['companies_id', 'findCompany', 'findUser', 'findSuperuser'])
    try {
      const query = User.query()
        .preload('company')
        .preload('usergroup')
      if (authenticate.superuser) {
        if (findCompany)
          query.where('companies_id', findCompany)
        else if (companies_id)
          query.where('companies_id', companies_id)
      } else {
        query.where('companies_id', authenticate.companies_id)
      }
      if (findUser)
        query.where('username', 'like', `%${findUser}%`)
      if (authenticate.superuser && findSuperuser !== undefined)
        query.where('superuser', ['1', 'true', true, 1].includes(findSuperuser) ? 1 : 0)
      const data = await query
      if (!authenticate.superuser) {
        const users = data.map((user) => {
          const payload: any = user.serialize()
          delete payload.superuser
          return payload
        })
        return response.status(200).send(users)
      }
      return response.status(200).send(data)
    } catch (error) {
      throw new BadRequest('Bad Request', 401, error)
    }


  }

  //retorna um registro
  public async show({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const query = User.query().where('id', params.id)
      .preload('usergroup', query => {
        query.preload('groupxpermission', subQuery => {
          subQuery.select('permissiongroup_id')

        })
      })
    query.if(!authenticate.superuser, query => {
      query.where('companies_id', authenticate.companies_id)
    })

    const data = await query.first()
    if (!authenticate.superuser && data) {
      const payload: any = data.serialize()
      delete payload.superuser
      return response.status(200).send(payload)
    }
    return response.status(200).send(data)

    // let query = ""
    // if (!authenticate.superuser)
    //   query = ` companies_id=${authenticate.companies_id} `
    // const data = await User.query()
    //   .whereRaw(query)
    //   .andWhere('id', "=", params.id).first()
    // return response.status(200).send(data)

  }

  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    if (!authenticate.superuser) {
      request.updateBody({
        ...request.all(),
        companies_id: authenticate.companies_id,
        superuser: false,
      })
    }
    const body = await request.validate(UserValidator)
    body.permission_level=1

    // Apenas superusuário pode criar outro usuário com privilégio de superusuário.
    if (!authenticate.superuser) {
      const usergroup = await Usergroup.query()
        .where('id', body.usergroup_id)
        .where('inactive', false)
        .where('available_for_user_creation', true)
        .first()

      if (!usergroup)
        throw new BadRequest('Grupo não permitido para cadastro de usuários', 402, 'user_error_201')

      body.companies_id = authenticate.companies_id
      body.superuser = false
    }

    const userByName = await User.query()
      .where('username', '=', body.username)
      .andWhere('companies_id', '=', body.companies_id).first()

    if (userByName) {
      let errorValidation: any = await new validations('user_error_203')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    try {
      const data = await User.create(body as any)
      let successValidation: any = await new validations('user_success_100')
      response.status(201).send(data, successValidation.code)

    } catch (error) {
      throw new BadRequest('Bad Request', 401, error)
    }
  }

  public async update({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    if (!authenticate.superuser) {
      request.updateBody({
        ...request.all(),
        companies_id: authenticate.companies_id,
        superuser: false,
      })
    }
    const body = await request.validate(UserValidator)
    const userId = Number(request.param('id'))
    body.id = userId
    const user = await User.findOrFail(userId)

    if (!authenticate.superuser) {
      if (user.companies_id !== authenticate.companies_id) {
        return response.forbidden({ message: 'Acesso permitido apenas para usuários da própria empresa' })
      }
      const usergroup = await Usergroup.query()
        .where('id', body.usergroup_id)
        .where('inactive', false)
        .where('available_for_user_creation', true)
        .first()

      if (!usergroup)
        throw new BadRequest('Grupo não permitido para cadastro de usuários', 402, 'user_error_201')

      body.companies_id = authenticate.companies_id
      body.superuser = Boolean(user.superuser)
    }

    try {
      const userUpdated = await user.merge(body as any).save()
      let successValidation: any = await new validations('user_success_201')
      return response.status(201).send(userUpdated, successValidation.code)
    } catch (error) {
      throw new BadRequest('Bad Request', 401, error)
    }


  }


  public async accessImage({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const data = await User.query()
      .where('companies_id', authenticate.companies_id)
      .andWhere('id', params.id).first()

    if (data?.access_image == undefined || data?.access_image == null) {

      return response.status(200).send(false)
    }
    const dataaccess = this.parseAccessImageDate(data?.access_image)
    const dateNow = DateTime.now()
    // Comparação
    if (dataaccess.isValid && dataaccess >= dateNow) {
      //console.log('A data de entrada é maior que a data atual', dataaccess.toFormat("yyyy-MM-dd"), dateNow.toFormat("yyyy-MM-dd"))
      return response.status(200).send(true)
    } else {
      //console.log('A data de entrada não menor')
      return response.status(200).send(false)
    }
  }

  public async closeAccesImage({ auth, params, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    const accessImageClosed = '2000-01-01 00:00'
    const data = await User.query()
      .where('companies_id', authenticate.companies_id)
      .where('id', params.id)
      .update({ 'access_image': accessImageClosed })

    return response.status(201).send({ valor: false, access_image: accessImageClosed, affectedRows: data })



  }



}
