import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Typebook from 'App/Models/Typebook'
import Company from 'App/Models/Company'
import { Response } from '@adonisjs/core/build/standalone'


export default class TypebooksController {


  //inserir livro
  public async store({ request, params, response }: HttpContextContract) {

    const body = request.only(Typebook.fillable)
    body.companies_id = params.companies_id

    try {
      await Company.findByOrFail('id', params.companies_id)
      const data = await Typebook.create(body)
      response.status(201)
      return {
        message: "Criado com sucesso",
        data: data,
      }

    } catch (error) {
      return error//response.status(401)
    }

  }

  //listar livro
  public async index({ request, params, response }) {

    const { name, status, books_id } = request.requestData

    if (!params.companies_id)
      return "error"

    if (!name && !status && !books_id) {
      const data = await Typebook.query().where("companies_id", '=', params.companies_id)
      return response.send(data)
    }
    else {

      let query = " 1=1 "
      let _status
      if (status !== undefined) {
        if (status === 'TRUE' || status === '1')
          _status = 1
        else
          if (status === 'FALSE' || status === '0')
            _status = 0
        query += ` and status =${_status} `
      }

      if (name !== undefined)
        query += ` and name like '%${name}%' `

      if (books_id !== undefined) {
        query += ` and books_id = ${books_id} `
      }

      const data
        = await Typebook.query().where("companies_id", '=', params.companies_id)
          .preload('bookrecords').preload('book')
          .whereRaw(query)


      return response.send(data)
    }


  }

//retorna um registro
  public async show({ params, response }: HttpContextContract) {

    const data = await Typebook.query()
                .where("companies_id","=",params.companies_id)
                .andWhere('id',"=",params.id).firstOrFail()

    return response.send(data)

  }

  //delete
  public async destroy({ params }: HttpContextContract) {
    const data = await Typebook.query()
    .where("companies_id","=",params.companies_id)
    .andWhere('id',"=",params.id).delete()

    return {
      message: "Livro excluido com sucesso.",
      data: data
    }

  }

  //patch ou put
  public async update({ request, params }: HttpContextContract) {

    const body = request.only(Typebook.fillable)

    body.id = params.id
    body.companies_id = params.companies_id

    const data = await Typebook.query()
    .where("companies_id","=",params.companies_id)
    .andWhere('id',"=",params.id).update(body)

    return {
      message: 'Tipo de Livro cadastrado com sucesso!!',
      data: data,
      body: body,
      params: params.id
    }

  }

}
