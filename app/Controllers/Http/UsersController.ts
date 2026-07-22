import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import BadRequest from 'App/Exceptions/BadRequestException'
import validations from 'App/Services/Validations/validations'
import UserValidator from 'App/Validators/UserValidator'
import { DateTime } from 'luxon'

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
    const { companies_id, findCompany, findUser } = request.only(['companies_id', 'findCompany', 'findUser'])
    try {
      const query = User.query()
        .preload('company')
      if (authenticate.superuser) {
        if (findCompany)
          query.where('companies_id', findCompany)
        else if (companies_id)
          query.where('companies_id', companies_id)
        else
          query.where('companies_id', authenticate.companies_id)
      } else {
        query.where('companies_id', authenticate.companies_id)
      }
      if (findUser)
        query.where('username', 'like', `%${findUser}%`)
      const data = await query
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
    const body = await request.validate(UserValidator)
    body.permission_level=1

    const userByName = await User.query()
      .where('username', '=', body.username)
      .andWhere('companies_id', '=', body.companies_id).first()

    if (userByName) {
      let errorValidation = await new validations('user_error_203')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    if (body.email) {
      const userByEmail = await User.findBy('email', body.email)
      if (userByEmail) {
        let errorValidation = await new validations('user_error_209')
        throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
      }
    }

    //********APENAS PARA USUÁRIO ADMIN NA EMPRESA 1 */
    if (!authenticate.superuser) {
      body.companies_id = authenticate.companies_id
    }

    try {
      const data = await User.create(body)
      let successValidation = await new validations('user_success_100')
      response.status(201).send(data, successValidation.code)

    } catch (error) {
      throw new BadRequest('Bad Request', 401, error)
    }
  }

  public async update({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    const body = await request.validate(UserValidator)
    body.id = request.param('id')
    const user = await User.findOrFail(body.id)

    if (!authenticate.superuser) {
      body.companies_id = authenticate.companies_id
    }

    if (body.email && body.email !== user.email) {
      const userByEmail = await User.query()
        .where('email', body.email)
        .andWhereNot('id', body.id)
        .first()

      if (userByEmail) {
        let errorValidation = await new validations('user_error_209')
        throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
      }
    }

    try {
      const userUpdated = await user.merge(body).save()
      let successValidation = await new validations('user_success_201')
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
