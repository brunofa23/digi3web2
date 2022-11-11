import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Bookrecord from 'App/Models/Bookrecord'

export default class BookrecordsController {

  public async index({ request, response }: HttpContextContract) {
    const body = request.only(Bookrecord.fillable)
    //console.log("TESTE", request.params())
    const data = await Bookrecord.query()
      .preload('bookrecords')
      .where('typebooks_id', '=', body.id)


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
    //console.log("SHOWWWW:", params)
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


  public async createorupdatebookrecord({ request }) {


    // console.log(request.requestBody)
    const data = await Bookrecord.updateOrCreateMany('id', request.requestBody)
    return data


  }


  // public async firstOrCreate() {

  //   const searchPayload = { cod: 2, book: 12 }
  //   const savePayload = { obs: 'FirstOrCreate1111', typebooks_id: 6, books_id:2 }

  //   const data =  await Bookrecord.firstOrCreate(searchPayload, savePayload)

  //   console.log("EXECUTEI FIRST OR CREATE")
  //   return data

  // }



  //Para geração de bookrecords
  public async fetchOrCreateMany({ request }) {

    const {sheet, book, books_id, typebooks_id} = request.requestData


    let cod = 1
    let sheetCount = 1


    const booksRecordsToCreate = [{cod: cod++, book, sheet: sheetCount, books_id, typebooks_id}]
    sheetCount++
    while (sheetCount <= sheet) {
      booksRecordsToCreate.push({ cod: cod++, book, sheet: sheetCount, books_id, typebooks_id })

        sheetCount++

    }

    console.log(booksRecordsToCreate)
    const data = await Bookrecord.fetchOrCreateMany(['cod', 'book'], booksRecordsToCreate)
    console.log("EXECUTEI fetchOrCreateMany")
    return data.length

  }



  //************************ */


}
