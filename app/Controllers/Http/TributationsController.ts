// app/Controllers/Http/TributationsController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Tributation from 'App/Models/Tributation'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class TributationsController {
  /**
   * Lista todas as tributações da empresa autenticada
   */
  public async index({ auth }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    return await Tributation.query()
      .where('companies_id', authenticate.companies_id)
      .orderBy('id', 'asc')
  }

  /**
   * Mostra uma tributação pelo ID
   */
  public async show({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    const tributation = await Tributation.find(params.id)

    if (!tributation) {
      return response.notFound({ message: 'Tributação não encontrada' })
    }

    return tributation
  }

  /**
   * Cria uma nova tributação
   */
  public async store({ auth, request, response }: HttpContextContract) {
    const authenticate = await auth.use('api').authenticate()

    const validationSchema = schema.create({
      description: schema.string({ trim: true }, [
        rules.maxLength(255),
      ]),
      inactive: schema.boolean.optional(),
    })

    const payload = await request.validate({ schema: validationSchema })

    const tributation = await Tributation.create({
      ...payload,
      companiesId: authenticate.companies_id,
    })

    return response.created(tributation)
  }

  /**
   * Atualiza uma tributação existente
   */
  public async update({ auth, params, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    const tributation = await Tributation.find(params.id)

    if (!tributation) {
      return response.notFound({ message: 'Tributação não encontrada' })
    }

    const validationSchema = schema.create({
      description: schema.string.optional({ trim: true }, [
        rules.maxLength(255),
      ]),
      inactive: schema.boolean.optional(),
    })

    const payload = await request.validate({ schema: validationSchema })

    tributation.merge(payload)
    await tributation.save()

    return tributation
  }

  /**
   * Deleta uma tributação
   */
  public async destroy({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    const tributation = await Tributation.find(params.id)

    if (!tributation) {
      return response.notFound({ message: 'Tributação não encontrada' })
    }

    await tributation.delete()

    return response.ok({ message: 'Tributação removida com sucesso' })
  }
}
