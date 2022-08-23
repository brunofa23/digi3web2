import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Indeximage from 'App/Models/Indeximage'

export default class IndeximagesController {

  public async store({ request, response }: HttpContextContract) {
    const body = request.only(Indeximage.fillable)
    //const id = params.id
    //Verificar se existe o codigo passado pelo parâmetro
    //await Book.findByOrFail(id)
    //body.id = id

    const data = await Indeximage.create(body)

    response.status(201)
    return{
      message: "Criado com sucesso",
      data: data,
    }

  }

  public async index({ response }) {
    //const data = await Typebook.all()
    const data = await Indeximage.query()
    //.preload('bookrecords')

    return response.send({ data })
  }


  public async show({params}: HttpContextContract){
    const data = await Indeximage.findOrFail(params.id)

    return{
      data:data,
    }
  }

  public async destroy({params}:HttpContextContract){
    const data = await Indeximage.findOrFail(params.id)

    await data.delete()

    return{
      message:"Livro excluido com sucesso.",
      data:data
    }

  }

  public async update({request, params }:HttpContextContract){
    const body = request.only(Indeximage.fillable)
    body.bookrecords_id = params.id
    body.typebooks_id = params.id2
    body.seq = params.id3


    const data = await Indeximage
  .query()
  .where('bookrecords_id', '=', body.bookrecords_id )
  .where('typebooks_id', '=', body.typebooks_id)
  .where('seq', '=', body.seq)
    //const data = await Indeximage.findMany([3,10, 1] )

    await data.fill(body).save()

    return{
      message:'Tipo de Livro cadastrado com sucesso!!',
      data: data,
      //body: body,
      params: params
    }

  }




}
