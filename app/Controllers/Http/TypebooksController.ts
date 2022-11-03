import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Typebook from 'App/Models/Typebook'
import Bookrecord from 'App/Models/Bookrecord'
import { Response } from '@adonisjs/core/build/standalone'

export default class TypebooksController {


  public async bookRecords({ params, response }: HttpContextContract) {

    console.log("Executei bookrecords", params.id)

    const data = await Bookrecord.query()
      .preload('bookrecords')
      .where('typebooks_id', '=', params.id)
     return response.send({ data })
  }




  public async store({ request, params, response }: HttpContextContract) {
    const body = request.only(Typebook.fillable)
    const id = params.id
    console.log(request)
    //Verificar se existe o codigo passado pelo parâmetro
    //await Book.findByOrFail(id)

    body.id = id

    const data = await Typebook.create(body)

    response.status(201)
    return {
      message: "Criado com sucesso",
      data: data,
    }

  }

  public async index({ request, response }) {
    const { id, name, status, books_id } = request.requestData

    console.log(id)
    console.log(name)
    console.log('status', status)
    console.log('books_id',books_id);



    if (!id && !name && !status && !books_id) {
      const data = await Typebook.all()
      console.log('tudo')
      return response.send({ data })
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

      if(books_id !==undefined){
        query += ` and books_id = ${books_id} `
      }

      const data
        = await Typebook.query()
          .preload('bookrecords').preload('book')
          .whereRaw(query)

      //.where(conditions.where)
      //.where("status","=", status)
      //.whereIn(conditions.whereILike)
      //.whereILike('name', `%${name}%`)


      return response.send({ data })
    }


  }


  public async show({ params }: HttpContextContract) {
    const data = await Typebook.findOrFail(params.id)

    return {
      data: data,
    }
  }

  public async destroy({ params }: HttpContextContract) {
    const data = await Typebook.findOrFail(params.id)

    await data.delete()

    return {
      message: "Livro excluido com sucesso.",
      data: data
    }

  }

  public async update({ request, params }: HttpContextContract) {
    const body = request.only(Typebook.fillable)
    body.id = params.id
    const data = await Typebook.findOrFail(body.id)
    await data.fill(body).save()
    return {
      message: 'Tipo de Livro cadastrado com sucesso!!',
      data: data,
      body: body,
      params: params.id
    }

  }

}
