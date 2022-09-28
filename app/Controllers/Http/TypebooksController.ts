import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Typebook from 'App/Models/Typebook'

export default class TypebooksController {

  public async store({ request,params, response }: HttpContextContract) {
    const body = request.only(Typebook.fillable)
    const id = params.id
    console.log(request)
    //Verificar se existe o codigo passado pelo parâmetro
    //await Book.findByOrFail(id)

    body.id = id

    const data = await Typebook.create(body)

    response.status(201)
    return{
      message: "Criado com sucesso",
      data: data,
    }

  }

  public async index({ request, response }) {

    console.log(request)
    //const data = await Typebook.all()
    const data = await Typebook.query()
    .preload('bookrecords')
    .preload('book')

    return response.send({ data })
  }


  public async show({params}: HttpContextContract){
    const data = await Typebook.findOrFail(params.id)

    return{
      data:data,
    }
  }

  public async destroy({params}:HttpContextContract){
    const data = await Typebook.findOrFail(params.id)

    await data.delete()

    return{
      message:"Livro excluido com sucesso.",
      data:data
    }

  }

  public async update({request, params }:HttpContextContract){
    const body = request.only(Typebook.fillable)
    body.id = params.id
    const data = await Typebook.findOrFail(body.id)
    await data.fill(body).save()
    return{
      message:'Tipo de Livro cadastrado com sucesso!!',
      data: data,
      body: body,
      params: params.id
    }

  }

}
