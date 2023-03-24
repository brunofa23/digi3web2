import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import BadRequest from 'App/Exceptions/BadRequestException'
import UserValidator from 'App/Validators/UserValidator'

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
    if (userByName)
      throw new BadRequest('Username already in use', 402)

    //********APENAS PARA USUÁRIO ADMIN NA EMPRESA 1 */
    if (!authenticate.superuser) {
      body.companies_id = authenticate.companies_id
    }

    const data = await User.create(body)
    response.status(201).send(data)
  }


  public async update({ auth, request, params, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    const body = await request.validate(UserValidator)
    body.companies_id = authenticate.companies_id
    body.id = params.id
    await User.query()
      .where("companies_id", "=", authenticate.companies_id)
      .andWhere('id', "=", params.id).update(body)

    return response.status(201).send(body)

  }



}
