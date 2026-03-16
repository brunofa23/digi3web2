import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Book from 'App/Models/Book'
import BadRequest from 'App/Exceptions/BadRequestException'

export default class BooksController {

  public async index({ auth, request, response }) {
  await auth.use('api').authenticate()

  const ordercertificateRaw = request.input('ordercertificate')
  const ordercertificate =
    ordercertificateRaw === undefined
      ? null
      : ordercertificateRaw === 'true'

  try {
    const query = Book
      .query()
      .preload('typebooks')

    if (ordercertificate !== null) {
      query.where('ordercertificate', ordercertificate)
    }

    const books = await query

    return response.status(200).send(books)
  } catch (error) {
    throw new BadRequest('Bad Request', 401, 'erro')
  }
}



  public async store({ request, response }: HttpContextContract) {
    const body = request.only(Book.fillable)
    response.send(body)
    const data = await Book.create(body)

    response.status(201)
    return {
      message: "Criado com sucesso",
      data: data,
    }

  }


  public async update({ request, params }: HttpContextContract) {
    const body = request.only(Book.fillable)
    body.id = params.id
    const data = await Book.findOrFail(body.id)
    await data.fill(body).save()
    return {
      message: 'Tipo de Livro cadastrado com sucesso!!',
      data: data,
      body: body,
      params: params.id
    }

  }

  public async destroy({ params }: HttpContextContract) {
    const data = await Book.findOrFail(params.id)

    await data.delete()

    return {
      message: "Livro excluido com sucesso.",
      data: data
    }

  }

}
