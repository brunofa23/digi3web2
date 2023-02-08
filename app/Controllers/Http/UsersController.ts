import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'
import Company from 'App/Models/Company'

export default class UsersController {

  public async index({auth, response }: HttpContextContract) {

    const authenticate = await auth.use('api').authenticate()

      const data = await User.query()
      .where("companies_id", authenticate.companies_id)
      return response.send(data)

  }

    //retorna um registro
    public async show({ auth, params, response }: HttpContextContract) {

      const authenticate = await auth.use('api').authenticate()
      let query = ""

      if(!authenticate.superuser)
        query = ` companies_id=${authenticate.companies_id} `

      const data = await User.query()
        .whereRaw(query)
        .andWhere('id', "=", params.id).firstOrFail()
  
      return response.send(data)
  
    }

  public async store({auth, request, response }: HttpContextContract) {

    const body = request.only(User.fillable)
    const authenticate = await auth.use('api').authenticate()

    //********APENAS PARA USUÁRIO ADMIN NA EMPRESA 1 */
    if(!authenticate.superuser)
    {
      body.companies_id =  authenticate.companies_id
    }
    const data = await User.create(body)

    response.status(201)
    return {
      message: 'Criado com sucesso',
      data: data,
    }
  }


  public async update({auth, request, params }:HttpContextContract){

    const authenticate = await auth.use('api').authenticate()
    const body = request.only(User.fillable)
    body.companies_id = authenticate.companies_id
    body.id = params.id

    const data = await User.query()
    .where("companies_id","=", authenticate.companies_id)
    .andWhere('id',"=",params.id).update(body)

    return data

  }



}
