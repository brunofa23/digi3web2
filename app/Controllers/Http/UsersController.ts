import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import BadRequest from 'App/Exceptions/BadRequestException'
import UserValidator from 'App/Validators/UserValidator'
import validations from 'App/Services/Validations/validations'

export default class UsersController {

  public async index({ auth, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    let query = ` companies_id=${authenticate.companies_id}`

    if (authenticate.superuser)
      query = ""

    const data = await User.query()
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
      .andWhere('id', "=", params.id).firstOrFail()

    return response.status(200).send(data)

  }

  public async store({ auth, request, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    const body = await request.validate(UserValidator)

    const userByName = await User.query()
      .where('username', '=', body.username)
      .andWhere('companies_id', '=', body.companies_id).first()
    if (userByName) {
      let errorValidation = await new validations('user_error_103')
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
      throw new BadRequest('Bad Request', 401)
    }
  }


  public async update({ auth, request, params, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    const body = await request.validate(UserValidator)
    body.companies_id = authenticate.companies_id
    body.id = params.id

    try {
      await User.query()
        .where("companies_id", "=", authenticate.companies_id)
        .andWhere('id', "=", params.id).update(body)

      let successValidation = await new validations('user_success_101')

      return response.status(201).send(body, successValidation.code)
    } catch (error) {
      throw new BadRequest('Bad Request', 401)
    }


  }



}
