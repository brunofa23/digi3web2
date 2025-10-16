import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Documenttype from 'App/Models/Documenttype'
import DocumenttypeValidator from 'App/Validators/DocumenttypeValidator'
import BadRequest from 'App/Exceptions/BadRequestException'
export default class DocumentTypesController {

  public async index({ auth, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    try {
      const documentType = await Documenttype.query()
        .where('companies_id', authenticate.companies_id)
      return response.status(200).send(documentType)
    } catch (error) {
      throw new BadRequest('Bad Request', 401, 'erro')
    }

  }


  public async store({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const body = await request.validate(DocumenttypeValidator)
      const documentType = await Documenttype.create(body)
      return response.status(201).send({
        message: 'Tipo de documento criado com sucesso',
        data: documentType,
      })
    } catch (error) {
      console.error('Erro ao criar tipo de documento:', error)
      // ✅ Tratamento de erro com retorno amigável
      throw new BadRequest('Erro ao criar tipo de documento', 400, error)
    }
  }



  public async update({ auth, request, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const body = await request.validate(DocumenttypeValidator)
      const documentType = await Documenttype.findOrFail(params.id)
      documentType.merge(body)
      await documentType.save()
      return response.status(200).send({
        message: 'Tipo de documento atualizado com sucesso',
        data: documentType,
      })
    } catch (error) {
      console.error('Erro ao atualizar tipo de documento:', error)
      throw new BadRequest('Erro ao atualizar tipo de documento', 400, error)
    }
  }





}
