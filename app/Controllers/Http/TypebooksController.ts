import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Typebook from 'App/Models/Typebook'

export default class TypebooksController {

  public async store({ request, response }: HttpContextContract) {
    const body = request.only(Typebook.fillable)
    response.send(body)
    const data = await Typebook.create(body)

    response.status(201)
    return{
      message: "Criado com sucesso",
      data: data,
    }

  }

  public async index({ response }) {
    const data = await Typebook
    .query()
    //.preload('livrotipos')

    return response.send({ data })
  }



}
