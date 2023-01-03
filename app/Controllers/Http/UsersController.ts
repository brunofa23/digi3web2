import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'
import Company from 'App/Models/Company'

export default class UsersController {

  public async index({ request, params, response }: HttpContextContract) {

      const data = await User.query()
      .where("companies_id", params.companies_id)

      return response.send(data)

  }

  public async store({ request, params, response }: HttpContextContract) {

    const body = request.only(User.fillable)
    const companies_id = params.companies_id
    body.password = await Hash.make(body.password)

    //Verificar se existe o codigo passado pelo parâmetro
    await Company.findOrFail(companies_id)
    const data = await User.create(body)

    response.status(201)
    return {
      message: 'Criado com sucesso',
      data: data,
    }
  }




}
