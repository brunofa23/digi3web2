import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Documenttype from 'App/Models/Documenttype'
import DocumenttypeValidator from 'App/Validators/DocumenttypeValidator'
import BadRequest from 'App/Exceptions/BadRequestException'
import { schema } from '@ioc:Adonis/Core/Validator'

export default class DocumentTypesController {

  // public async index({ auth, response }: HttpContextContract) {
  //   const authenticate = await auth.use('api').authenticate()

  //   try {
  //     const documentType = await Documenttype.query()
  //       .where('companies_id', authenticate.companies_id)
  //       .orderBy('name')
  //     return response.status(200).send(documentType)
  //   } catch (error) {
  //     throw new BadRequest('Bad Request', 401, 'erro')
  //   }

  // }

  public async index({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    // ✅ valida querystring
    const querySchema = schema.create({
      local: schema.enum.optional(['certificate', 'document'] as const),
    })

    const { local } = await request.validate({ schema: querySchema })

    try {
      const q = Documenttype.query()
        .where('companies_id', authenticate.companies_id)

      // ✅ aplica filtro se vier
      if (local) {
        q.andWhere('local', local) // ajuste o nome da coluna conforme seu banco
        // se sua coluna chama local_type, por ex:
        // q.andWhere('local_type', local)
      }

      const documentType = await q.orderBy('name')
      return response.ok(documentType)
    } catch (error) {
      throw new BadRequest('Bad Request', 401, 'erro')
    }
  }


  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    try {
      const body = await request.validate(DocumenttypeValidator)
      body.companies_id = authenticate.companies_id
      const documentType = await Documenttype.create(body)
      return response.status(201).send(documentType)
    } catch (error) {
      console.error('Erro ao criar tipo de documento:', error)
      // ✅ Tratamento de erro com retorno amigável
      throw new BadRequest('Erro ao criar tipo de documento', 400, error)
    }
  }



  public async update({ auth, request, params, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()
    try {
      const body = await request.validate(DocumenttypeValidator)
      body.companies_id = authenticate.companies_id
      const documentType = await Documenttype.findOrFail(params.id)
      documentType.merge(body)
      await documentType.save()
      return response.status(200).send(documentType)
    } catch (error) {
      console.error('Erro ao atualizar tipo de documento:', error)
      throw new BadRequest('Erro ao atualizar tipo de documento', 400, error)
    }
  }





}
