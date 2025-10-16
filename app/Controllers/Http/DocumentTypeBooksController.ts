import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import DocumentTypeBook from 'App/Models/DocumentTypeBook'
import DocumentTypeBookValidator from 'App/Validators/DocmentTypeBookValidator'
import BadRequest from 'App/Exceptions/BadRequestException'

export default class DocumentTypeBooksController {
  /**
   * 📋 Lista todos os tipos de livros/documentos
   */
  public async index({ auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    try {
      const data = await DocumentTypeBook.query().orderBy('id', 'asc')
      return response.status(200).send({
        message: 'Lista de tipos de livros/documentos obtida com sucesso',
        data,
      })
    } catch (error) {
      console.error('Erro ao listar tipos de livros/documentos:', error)
      throw new BadRequest('Erro ao listar registros', 400, error)
    }
  }

  /**
   * 🧾 Cria um novo tipo de livro/documento
   */
  public async store({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const body = await request.validate(DocumentTypeBookValidator)
      const documentTypeBook = await DocumentTypeBook.create(body)

      return response.status(201).send({
        message: 'Tipo de livro/documento criado com sucesso',
        data: documentTypeBook,
      })
    } catch (error) {
      console.error('Erro ao criar tipo de livro/documento:', error)
      throw new BadRequest('Erro ao criar registro', 400, error)
    }
  }

  /**
   * ✏️ Atualiza um tipo de livro/documento existente
   */
  public async update({ auth, request, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    try {
      const body = await request.validate(DocumentTypeBookValidator)
      const documentTypeBook = await DocumentTypeBook.findOrFail(params.id)

      documentTypeBook.merge(body)
      await documentTypeBook.save()

      return response.status(200).send({
        message: 'Tipo de livro/documento atualizado com sucesso',
        data: documentTypeBook,
      })
    } catch (error) {
      console.error('Erro ao atualizar tipo de livro/documento:', error)
      throw new BadRequest('Erro ao atualizar registro', 400, error)
    }
  }
}
