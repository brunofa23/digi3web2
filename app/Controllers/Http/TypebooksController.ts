import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Book from 'App/Models/Book'
import Typebook from 'App/Models/Typebook'

export default class TypebooksController {

  public async store({ request,params, response }: HttpContextContract) {
    const body = request.only(Typebook.fillable)
    const id = params.id

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

  public async index({ response }) {
    const data = await Typebook.all()
    //.query()
    //.preload('livrotipos')

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

  public async update({params, request}:HttpContextContract){
    const body = request.only(Typebook.fillable)
    const data = await Typebook.findOrFail(params.id)
    //await data.fill(body).save()
    // data.name = body.title
    // data.status = body.status
    // data.path = body.path

    // await data.save();

    return{
      message:'Tipo de Livro cadastrado com sucesso!!',
      data: data,
      body: body
    }

  }

}
