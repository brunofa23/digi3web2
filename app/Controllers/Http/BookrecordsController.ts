import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Bookrecord from 'App/Models/Bookrecord'

export default class BookrecordsController {
  public async index({ response }) {
    const data = await Bookrecord.all()
    //const data = await Bookrecord.query()
    //.preload('livrotipos')

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


  public async show({params}: HttpContextContract){
    const data = await Bookrecord.findOrFail(params.id)

    return{
      data:data,
    }
  }


  public async destroy({params}:HttpContextContract){
    const data = await Bookrecord.findOrFail(params.id)

    await data.delete()

    return{
      message:"Livro excluido com sucesso.",
      data:data
    }

  }


  public async update({request, params }:HttpContextContract){
    const body = request.only(Bookrecord.fillable)
    body.id = params.id
    const data = await Bookrecord.findOrFail(body.id)
    await data.fill(body).save()
    return{
      message:'Tipo de Livro cadastrado com sucesso!!',
      data: data,
      params: params.id
    }

  }






  //************************ */
}
