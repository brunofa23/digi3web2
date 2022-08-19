import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Book from 'App/Models/Book'


export default class BooksController {

  public async store({ request, response }: HttpContextContract) {
    const body = request.only(Book.fillable)
    response.send(body)
    const data = await Book.create(body)

    response.status(201)
    return{
      message: "Criado com sucesso",
      data: data,
    }

  }


  public async index({ response }) {
    const books = await Book
    .query()
    //.preload('livrotipos')

    return response.send({ books })
  }



}
