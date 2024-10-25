import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import BadRequest from 'App/Exceptions/BadRequestException'
import validations from 'App/Services/Validations/validations'
import UserValidator from 'App/Validators/UserValidator'
import { DateTime } from 'luxon'
import { accesscontextmanager } from 'googleapis/build/src/apis/accesscontextmanager'


export default class UsersController {

  public async index({ auth, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    let query = ` companies_id=${authenticate.companies_id}`

    if (authenticate.superuser)
      query = ""

    const data = await User.query()
      .preload('company')
      .whereRaw(query)

    return response.status(200).send(data)

  }

  //retorna um registro
  public async show({ auth, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    let query = ""
    if (!authenticate.superuser)
      query = ` companies_id=${authenticate.companies_id} `
    const data = await User.query()
      .whereRaw(query)
      .andWhere('id', "=", params.id).first()
    return response.status(200).send(data)

  }

  public async store({ auth, request, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    const body = await request.validate(UserValidator)

    const userByName = await User.query()
      .where('username', '=', body.username)
      .andWhere('companies_id', '=', body.companies_id).first()

    if (userByName) {
      let errorValidation = await new validations('user_error_203')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
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
      console.log("a data não é valida")
      return response.status(200).send(false)
    }
    const dataaccess = DateTime.fromJSDate(data?.access_image)
    const dateNow = DateTime.now()
    // Comparação
    if (dataaccess >= dateNow) {
      //console.log('A data de entrada é maior que a data atual', dataaccess.toFormat("yyyy-MM-dd"), dateNow.toFormat("yyyy-MM-dd"))
      return response.status(200).send(true)
    } else {
      //console.log('A data de entrada não menor')
      return response.status(200).send(false)
    }
  }

  public async closeAccesImage({ auth, params, response }: HttpContextContract) {

    // const authenticate = await auth.use('api').authenticate()

    const data = await User.query()
    .where('id', params.id)
    .update({'access_image':'2000-01-01'})

    return response.status(201).send(data)



  }



}
