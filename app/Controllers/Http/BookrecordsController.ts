import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Bookrecord from 'App/Models/Bookrecord'

export default class BookrecordsController {
  public async index({ response }) {
    //const data = await Bookrecord.all()
    const data = await Bookrecord.query()
      .preload('bookrecords')


    //*** PARA CRIAR QUERY ESPECÍFICA */
    // const data = await Database.from('bookrecords').select(
    //   'typebooks_id',
    //   'books_id',
    //   'cod',
    //   'book',
    //   'sheet',
    //   'side',
    //   'approximate_term',
    //   'index',
    //   'obs',
    //   'letter',
    //   'year',
    //   'model',
    // )

    return response.send({ data })
  }

  public async store({ request, params, response }: HttpContextContract) {
    const body = request.only(Bookrecord.fillable)
    const id = params.id

    //Verificar se existe o codigo passado pelo parâmetro
    //await Book.findByOrFail(id)

    body.id = id

    const data = await Bookrecord.create(body)

    response.status(201)
    return {
      message: 'Criado com sucesso',
      data: data,
    }
  }


  public async show({ params }: HttpContextContract) {
    const data = await Bookrecord.findOrFail(params.id)

    return {
      data: data,
    }
  }


  public async destroy({ params }: HttpContextContract) {
    const data = await Bookrecord.findOrFail(params.id)

    await data.delete()

    return {
      message: "Livro excluido com sucesso.",
      data: data
    }

  }


  public async update({ request, params }: HttpContextContract) {
    const body = request.only(Bookrecord.fillable)
    body.id = params.id
    const data = await Bookrecord.findOrFail(body.id)
    await data.fill(body).save()
    return {
      message: 'Tipo de Livro cadastrado com sucesso!!',
      data: data,
      params: params.id
    }

  }



  public async updateorcreatemany({ response }) {
    const data = await Bookrecord.query()
      .preload('bookrecords')

    const keyForSearch = 'id'
    const bookrecordsUpdate = [
      {

        "typebooks_id": 6,
        "books_id": 2,
        "cod": 1,
        "book": 1,
        "sheet": 1,
        "side": "V",
        "index": 0,


      },
      {
        "typebooks_id": 6,
        "books_id": 2,
        "cod": 2,
        "book": 1,
        "sheet": 2,
        "side": "V",
        "index": 0,
      },
      {
        "typebooks_id": 6,
        "books_id": 2,
        "cod": 2,
        "book": 11,
        "sheet": 2,
        "side": "V",
        "index": 0,
      },
      {
        "typebooks_id": 6,
        "books_id": 2,
        "cod": 2,
        "book": 9,
        "sheet": 2,
        "side": "V",
        "index": 0,
      },
      {
        "typebooks_id": 6,
        "books_id": 2,
        "cod": 2,
        "book": 9,
        "sheet": 2,
        "side": "V",
        "index": 0,
      }

    ]


    this.updatemany(bookrecordsUpdate)

    return response.send({ data })

  }



  public async updatemany(bookrecordsUpdate ) {
    //console.log('payload:::',payload)
    const data = await Bookrecord.createMany(bookrecordsUpdate)
    console.log('data:::',data)
    //return data
    // for (let _data of data) {
    //   if (_data.$isLocal) {
    //     // local+persisted instance
    //   } else {
    //     // existing row in the database
    //   }


  }




  //************************ */


}
