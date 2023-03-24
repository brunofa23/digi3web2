import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import BadRequest from 'App/Exceptions/BadRequestException'

export default class UsersController {

  public async index({ auth, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    if (!authenticate.superuser)
      throw new BadRequest('not superuser', 401)

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

    const body = request.only(User.fillable)
    const authenticate = await auth.use('api').authenticate()

    //********APENAS PARA USUÁRIO ADMIN NA EMPRESA 1 */
    if (!authenticate.superuser) {
      body.companies_id = authenticate.companies_id
    }
    const data = await User.create(body)

    response.status(201).send(data)

  }


  public async update({ auth, request, params, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()
    const body = request.only(User.fillable)
    body.companies_id = authenticate.companies_id
    body.id = params.id

    const data = await User.query()
      .where("companies_id", "=", authenticate.companies_id)
      .andWhere('id', "=", params.id).update(body)

    //return data
    return response.status(201).send(data)

  }



}
